import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { dbAsync } from './src/db.js';

// Extend Express Request interface for req.user globally
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      } | null;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper middleware for custom authentication/role check
  // In a real application, you would use session cookies or JWT.
  // Here, we'll pass a custom header `X-User-Id` and `X-User-Role` from the client for easy, robust integration.
  const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userIdHeader = req.headers['x-user-id'];
    const userRoleHeader = req.headers['x-user-role'];

    if (userIdHeader) {
      req.user = {
        id: parseInt(userIdHeader as string),
        role: userRoleHeader as string,
      };
    } else {
      req.user = null; // Unregistered user
    }
    next();
  };

  app.use(authMiddleware);

  // Helper to create notifications
  async function createNotification(userId: number | null, title: string, message: string, link: string = '') {
    try {
      // If userId is null, send to everyone (broadcast)
      if (userId === null) {
        // Find all student profiles
        const students = await dbAsync.all('SELECT id FROM profiles WHERE role != ?', ['instructor']);
        for (const stud of students) {
          await dbAsync.run(
            'INSERT INTO notifications (user_id, title, message, link, read) VALUES (?, ?, ?, ?, ?)',
            [stud.id, title, message, link, 0]
          );
        }
      } else {
        await dbAsync.run(
          'INSERT INTO notifications (user_id, title, message, link, read) VALUES (?, ?, ?, ?, ?)',
          [userId, title, message, link, 0]
        );
      }
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  }

  // Programmatically create notifications table if not exists (just in case)
  try {
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error('Error setting up notifications table:', err);
  }

  // --- API ENDPOINTS ---

  // 1. Auth & Profiles
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await dbAsync.get('SELECT id, username, role, name FROM profiles WHERE username = ? AND password = ?', [username, password]);
      if (user) {
        res.json({ success: true, user });
      } else {
        res.status(401).json({ success: false, error: 'Invalid username or password' });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // Instructor registers a student
  app.post('/api/auth/register', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Only instructor can register students' });
    }

    const { username, password, role, name } = req.body;
    if (!username || !password || !role || !name) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    try {
      const result = await dbAsync.run('INSERT INTO profiles (username, password, role, name) VALUES (?, ?, ?, ?)', [
        username, password, role, name
      ]);
      res.json({ success: true, id: result.id });
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ success: false, error: 'Username already exists' });
      } else {
        res.status(500).json({ success: false, error: 'Database error' });
      }
    }
  });

  // Get all registered students
  app.get('/api/students', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    try {
      const students = await dbAsync.all('SELECT id, username, role, name, created_at FROM profiles WHERE role != ?', ['instructor']);
      res.json(students);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // 2. Attendance Endpoints
  // Mark or update attendance
  app.post('/api/attendance/mark', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { student_id, date, status } = req.body;
    if (!student_id || !date || !status) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    try {
      // Check if attendance already exists for this student on this date
      const existing = await dbAsync.get('SELECT id FROM attendance WHERE student_id = ? AND date = ?', [student_id, date]);
      if (existing) {
        await dbAsync.run('UPDATE attendance SET status = ?, marked_by = ? WHERE id = ?', [status, req.user.id, existing.id]);
      } else {
        await dbAsync.run('INSERT INTO attendance (student_id, date, status, marked_by) VALUES (?, ?, ?, ?)', [
          student_id, date, status, req.user.id
        ]);
      }

      // Send simulated push notification
      await createNotification(
        student_id,
        'Attendance Updated',
        `You have been marked ${status} for ${date} by Diwan Sir.`
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // View attendance
  app.get('/api/attendance', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }

    try {
      if (req.user.role === 'instructor') {
        // Instructor views all attendance logs
        const logs = await dbAsync.all(`
          SELECT a.*, p.name as student_name, p.role as student_role
          FROM attendance a
          JOIN profiles p ON a.student_id = p.id
          ORDER BY a.date DESC, p.name ASC
        `);
        res.json(logs);
      } else {
        // Student views their own logs only
        const logs = await dbAsync.all('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC', [req.user.id]);
        res.json(logs);
      }
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // 3. Announcements Endpoints
  app.get('/api/announcements', async (req, res) => {
    // Unregistered view: only audience = 'open'
    // Online student: open + both + online
    // Offline student: open + both
    // Instructor: all
    try {
      let query = '';
      let params: any[] = [];

      if (!req.user) {
        query = 'SELECT * FROM announcements WHERE audience = ? ORDER BY created_at DESC';
        params = ['open'];
      } else if (req.user.role === 'instructor') {
        query = 'SELECT * FROM announcements ORDER BY created_at DESC';
      } else if (req.user.role === 'online_student') {
        query = "SELECT * FROM announcements WHERE audience IN ('open', 'both', 'online') ORDER BY created_at DESC";
      } else if (req.user.role === 'offline_student') {
        query = "SELECT * FROM announcements WHERE audience IN ('open', 'both') ORDER BY created_at DESC";
      }

      const list = await dbAsync.all(query, params);
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/announcements', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { title, content, url, audience } = req.body;
    try {
      const result = await dbAsync.run(
        'INSERT INTO announcements (title, content, url, audience) VALUES (?, ?, ?, ?)',
        [title, content, url || '', audience]
      );

      // Trigger notifications for appropriate students
      let notifMessage = `New Announcement: ${title}`;
      if (audience === 'open') {
        await createNotification(null, 'New Open Announcement', notifMessage);
      } else if (audience === 'both') {
        // Send to everyone
        await createNotification(null, 'Announcement for All Students', notifMessage);
      } else if (audience === 'online') {
        // Send to online students
        const onlineStudents = await dbAsync.all("SELECT id FROM profiles WHERE role = 'online_student'");
        for (const os of onlineStudents) {
          await createNotification(os.id, 'Online Student Update', notifMessage);
        }
      }

      res.json({ success: true, id: result.id });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.put('/api/announcements/:id', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { title, content, url, audience } = req.body;
    const { id } = req.params;
    try {
      await dbAsync.run(
        'UPDATE announcements SET title = ?, content = ?, url = ?, audience = ? WHERE id = ?',
        [title, content, url || '', audience, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.delete('/api/announcements/:id', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    try {
      await dbAsync.run('DELETE FROM announcements WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // 4. Practice Videos Endpoints
  app.get('/api/practice-videos', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }

    try {
      if (req.user.role === 'instructor') {
        const videos = await dbAsync.all('SELECT * FROM practice_videos ORDER BY created_at DESC');
        res.json(videos);
      } else {
        const videos = await dbAsync.all('SELECT * FROM practice_videos WHERE student_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(videos);
      }
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/practice-videos', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }

    const { title, video_url, description } = req.body;
    try {
      // Get student's name
      const profile = await dbAsync.get('SELECT name FROM profiles WHERE id = ?', [req.user.id]);
      const studentName = profile ? profile.name : 'Unknown Student';

      const result = await dbAsync.run(
        'INSERT INTO practice_videos (student_id, student_name, video_url, title, description) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, studentName, video_url, title, description || '']
      );

      // Notify instructor (mock notification in DB, or just system log)
      res.json({ success: true, id: result.id });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.post('/api/practice-videos/:id/feedback', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { feedback_text, feedback_audio_url } = req.body;

    try {
      const video = await dbAsync.get('SELECT student_id, title FROM practice_videos WHERE id = ?', [id]);
      if (!video) {
        return res.status(404).json({ success: false, error: 'Video record not found' });
      }

      await dbAsync.run(
        'UPDATE practice_videos SET feedback_text = ?, feedback_audio_url = ? WHERE id = ?',
        [feedback_text, feedback_audio_url || '', id]
      );

      // Notify student
      await createNotification(
        video.student_id,
        'Feedback Left on Speaking Video',
        `Diwan Sir left feedback on your video: "${video.title}"`
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.put('/api/practice-videos/:id', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }
    const { id } = req.params;
    const { title, video_url, description } = req.body;
    try {
      const video = await dbAsync.get('SELECT * FROM practice_videos WHERE id = ?', [id]);
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      if (req.user.role !== 'instructor' && video.student_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      await dbAsync.run(
        'UPDATE practice_videos SET title = ?, video_url = ?, description = ? WHERE id = ?',
        [title, video_url, description || '', id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.delete('/api/practice-videos/:id', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }
    const { id } = req.params;
    try {
      const video = await dbAsync.get('SELECT * FROM practice_videos WHERE id = ?', [id]);
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      if (req.user.role !== 'instructor' && video.student_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      await dbAsync.run('DELETE FROM practice_videos WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // 5. Practice Materials Endpoints
  app.get('/api/practice-materials', async (req, res) => {
    try {
      if (!req.user) {
        // Unregistered guest: ONLY accessible if enabled as Public
        const list = await dbAsync.all('SELECT * FROM practice_materials WHERE is_public = ? ORDER BY created_at DESC', [1]);
        return res.json(list);
      }
      // Signed in users (students & instructor)
      const list = await dbAsync.all('SELECT * FROM practice_materials ORDER BY created_at DESC');
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/practice-materials', async (req, res) => {
    const canModify = req.user && req.user.role === 'instructor';
    if (!canModify) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { category, title, content, url, image_url, is_public } = req.body;
    const pubVal = (is_public === 0 || is_public === false || is_public === '0') ? 0 : 1;
    try {
      const result = await dbAsync.run(
        'INSERT INTO practice_materials (category, title, content, url, image_url, is_public) VALUES (?, ?, ?, ?, ?, ?)',
        [category, title, content || '', url || '', image_url || '', pubVal]
      );

      // Broadcast notification
      await createNotification(
        null,
        'New Practice Content Uploaded',
        `New study material posted in ${category}: "${title}"`
      );

      res.json({ success: true, id: result.id });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.put('/api/practice-materials/:id', async (req, res) => {
    const canModify = req.user && req.user.role === 'instructor';
    if (!canModify) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { category, title, content, url, image_url, is_public } = req.body;
    const pubVal = (is_public === 0 || is_public === false || is_public === '0') ? 0 : 1;
    const { id } = req.params;
    try {
      await dbAsync.run(
        'UPDATE practice_materials SET category = ?, title = ?, content = ?, url = ?, image_url = ?, is_public = ? WHERE id = ?',
        [category, title, content || '', url || '', image_url || '', pubVal, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.patch('/api/practice-materials/:id/toggle-public', async (req, res) => {
    const canModify = req.user && req.user.role === 'instructor';
    if (!canModify) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const { id } = req.params;
    try {
      const item = await dbAsync.get('SELECT * FROM practice_materials WHERE id = ?', [id]);
      if (!item) return res.status(404).json({ error: 'Material not found' });
      const newStatus = (item.is_public === 1 || item.is_public === undefined) ? 0 : 1;
      await dbAsync.run('UPDATE practice_materials SET is_public = ? WHERE id = ?', [newStatus, id]);
      res.json({ success: true, is_public: newStatus });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.delete('/api/practice-materials/:id', async (req, res) => {
    const canModify = req.user && req.user.role === 'instructor';
    if (!canModify) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    try {
      await dbAsync.run('DELETE FROM practice_materials WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // 6. Idioms Endpoints
  app.get('/api/idioms', async (req, res) => {
    try {
      if (!req.user) {
        // Unregistered guest: ONLY accessible if enabled as Public
        const list = await dbAsync.all('SELECT * FROM idioms_phrases WHERE is_public = ? ORDER BY phrase ASC', [1]);
        return res.json(list);
      }
      // Signed in users
      const list = await dbAsync.all('SELECT * FROM idioms_phrases ORDER BY phrase ASC');
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/idioms', async (req, res) => {
    const canModify = req.user && req.user.role === 'instructor';
    if (!canModify) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { phrase, meaning, usage, is_public } = req.body;
    const pubVal = (is_public === 0 || is_public === false || is_public === '0') ? 0 : 1;
    try {
      const result = await dbAsync.run(
        'INSERT INTO idioms_phrases (phrase, meaning, usage, is_public) VALUES (?, ?, ?, ?)',
        [phrase, meaning, usage, pubVal]
      );
      res.json({ success: true, id: result.id });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.put('/api/idioms/:id', async (req, res) => {
    const canModify = req.user && req.user.role === 'instructor';
    if (!canModify) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { phrase, meaning, usage, is_public } = req.body;
    const pubVal = (is_public === 0 || is_public === false || is_public === '0') ? 0 : 1;
    const { id } = req.params;
    try {
      await dbAsync.run(
        'UPDATE idioms_phrases SET phrase = ?, meaning = ?, usage = ?, is_public = ? WHERE id = ?',
        [phrase, meaning, usage, pubVal, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.patch('/api/idioms/:id/toggle-public', async (req, res) => {
    const canModify = req.user && req.user.role === 'instructor';
    if (!canModify) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const { id } = req.params;
    try {
      const item = await dbAsync.get('SELECT * FROM idioms_phrases WHERE id = ?', [id]);
      if (!item) return res.status(404).json({ error: 'Idiom not found' });
      const newStatus = (item.is_public === 1 || item.is_public === undefined) ? 0 : 1;
      await dbAsync.run('UPDATE idioms_phrases SET is_public = ? WHERE id = ?', [newStatus, id]);
      res.json({ success: true, is_public: newStatus });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.delete('/api/idioms/:id', async (req, res) => {
    const canModify = req.user && req.user.role === 'instructor';
    if (!canModify) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    try {
      await dbAsync.run('DELETE FROM idioms_phrases WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // 7. Doubts Endpoints
  app.get('/api/doubts', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }

    try {
      if (req.user.role === 'instructor') {
        const list = await dbAsync.all('SELECT * FROM doubts ORDER BY created_at DESC');
        res.json(list);
      } else {
        const list = await dbAsync.all('SELECT * FROM doubts WHERE student_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(list);
      }
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/doubts', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }

    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    try {
      const profile = await dbAsync.get('SELECT name FROM profiles WHERE id = ?', [req.user.id]);
      const studentName = profile ? profile.name : 'Unknown Student';

      const result = await dbAsync.run(
        'INSERT INTO doubts (student_id, student_name, question) VALUES (?, ?, ?)',
        [req.user.id, studentName, question]
      );
      res.json({ success: true, id: result.id });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.post('/api/doubts/:id/solve', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { solution } = req.body;
    const { id } = req.params;

    try {
      const doubt = await dbAsync.get('SELECT student_id, question FROM doubts WHERE id = ?', [id]);
      if (!doubt) {
        return res.status(404).json({ success: false, error: 'Doubt not found' });
      }

      await dbAsync.run(
        "UPDATE doubts SET solution = ?, solved_at = CURRENT_TIMESTAMP WHERE id = ?",
        [solution, id]
      );

      // Send notification to the student
      await createNotification(
        doubt.student_id,
        'Doubt Solved by Diwan Sir',
        `Your doubt: "${doubt.question.substring(0, 30)}..." has been resolved.`
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.put('/api/doubts/:id', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }
    const { id } = req.params;
    const { question, solution } = req.body;
    try {
      const doubt = await dbAsync.get('SELECT * FROM doubts WHERE id = ?', [id]);
      if (!doubt) {
        return res.status(404).json({ error: 'Doubt not found' });
      }
      if (req.user.role !== 'instructor' && doubt.student_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      if (req.user.role === 'instructor') {
        await dbAsync.run(
          'UPDATE doubts SET question = ?, solution = ? WHERE id = ?',
          [question || doubt.question, solution !== undefined ? solution : doubt.solution, id]
        );
      } else {
        await dbAsync.run(
          'UPDATE doubts SET question = ? WHERE id = ?',
          [question, id]
        );
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.delete('/api/doubts/:id', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }
    const { id } = req.params;
    try {
      const doubt = await dbAsync.get('SELECT * FROM doubts WHERE id = ?', [id]);
      if (!doubt) {
        return res.status(404).json({ error: 'Doubt not found' });
      }
      if (req.user.role !== 'instructor' && doubt.student_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      await dbAsync.run('DELETE FROM doubts WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // 8. Notifications Feed
  app.get('/api/notifications', async (req, res) => {
    if (!req.user) {
      return res.json([]);
    }
    try {
      const list = await dbAsync.all(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [req.user.id]
      );
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/notifications/read-all', async (req, res) => {
    if (!req.user) {
      return res.json({ success: true });
    }
    try {
      await dbAsync.run('UPDATE notifications SET read = 1 WHERE user_id = ?', [req.user.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // 9. Class Scheduling Endpoints
  app.get('/api/schedules', async (req, res) => {
    try {
      const list = await dbAsync.all('SELECT * FROM schedules ORDER BY created_at DESC');
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/schedules', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const { slot_time } = req.body;
    try {
      const result = await dbAsync.run(
        'INSERT INTO schedules (slot_time, is_booked, booked_by_name) VALUES (?, ?, ?)',
        [slot_time, 0, null]
      );
      res.json({ success: true, id: result.id });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.put('/api/schedules/:id', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { slot_time, is_booked, booked_by_name } = req.body;
    try {
      await dbAsync.run(
        'UPDATE schedules SET slot_time = ?, is_booked = ?, booked_by_name = ? WHERE id = ?',
        [slot_time, is_booked ? 1 : 0, booked_by_name || null, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.post('/api/schedules/:id/book', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }
    const { id } = req.params;
    try {
      const profile = await dbAsync.get('SELECT name FROM profiles WHERE id = ?', [req.user.id]);
      const studentName = profile ? profile.name : 'Student';

      await dbAsync.run(
        'UPDATE schedules SET is_booked = 1, booked_by_name = ? WHERE id = ?',
        [studentName, id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  app.delete('/api/schedules/:id', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const { id } = req.params;
    try {
      await dbAsync.run('DELETE FROM schedules WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // 10. Student Profile Endpoints (Edit & Delete)
  app.put('/api/students/:id', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { name, username, password, role } = req.body;
    try {
      if (password && password.trim()) {
        await dbAsync.run(
          'UPDATE profiles SET name = ?, username = ?, password = ?, role = ? WHERE id = ?',
          [name, username, password, role, id]
        );
      } else {
        await dbAsync.run(
          'UPDATE profiles SET name = ?, username = ?, role = ? WHERE id = ?',
          [name, username, role, id]
        );
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Database error' });
    }
  });

  app.delete('/api/students/:id', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const { id } = req.params;
    try {
      await dbAsync.run('DELETE FROM profiles WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // 11. Attendance Reset / Delete
  app.delete('/api/attendance/:id', async (req, res) => {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    const { id } = req.params;
    try {
      await dbAsync.run('DELETE FROM attendance WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC FILES ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
