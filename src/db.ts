import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data.json');

interface DbSchema {
  notifications: any[];
  profiles: any[];
  attendance: any[];
  announcements: any[];
  practice_videos: any[];
  practice_materials: any[];
  idioms_phrases: any[];
  doubts: any[];
  schedules: any[];
  [key: string]: any[];
}

function loadDb(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading data.json:', err);
  }
  return {
    notifications: [],
    profiles: [],
    attendance: [],
    announcements: [],
    practice_videos: [],
    practice_materials: [],
    idioms_phrases: [],
    doubts: [],
    schedules: [],
  };
}

function saveDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data.json:', err);
  }
}

function nextId(table: any[]): number {
  if (!table || table.length === 0) return 1;
  return Math.max(...table.map((r) => Number(r.id) || 0)) + 1;
}

export const dbAsync = {
  async all(sql: string, params: any[] = []): Promise<any[]> {
    const db = loadDb();
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.includes('FROM profiles WHERE role != ?')) {
      const role = params[0];
      return db.profiles.filter((p) => p.role !== role);
    }

    if (q.includes("FROM profiles WHERE role = 'online_student'")) {
      return db.profiles.filter((p) => p.role === 'online_student');
    }

    if (q.includes("FROM profiles WHERE role = 'instructor'")) {
      return db.profiles.filter((p) => p.role === 'instructor');
    }

    if (q.includes('FROM attendance a JOIN profiles p ON a.student_id = p.id')) {
      return db.attendance
        .map((a) => {
          const p = db.profiles.find((prof) => Number(prof.id) === Number(a.student_id));
          return {
            ...a,
            student_name: p ? p.name : 'Unknown',
            student_role: p ? p.role : '',
          };
        })
        .sort((x, y) => {
          if (x.date !== y.date) return y.date.localeCompare(x.date);
          return (x.student_name || '').localeCompare(y.student_name || '');
        });
    }

    if (q.includes('FROM attendance WHERE student_id = ?')) {
      const studentId = Number(params[0]);
      return db.attendance
        .filter((a) => Number(a.student_id) === studentId)
        .sort((x, y) => y.date.localeCompare(x.date));
    }

    if (q.includes('FROM announcements')) {
      let rows = [...db.announcements];
      if (q.includes('WHERE audience = ?')) {
        rows = rows.filter((a) => a.audience === params[0]);
      } else if (q.includes("WHERE audience IN ('open', 'both', 'online')")) {
        rows = rows.filter((a) => ['open', 'both', 'online'].includes(a.audience));
      } else if (q.includes("WHERE audience IN ('open', 'both')")) {
        rows = rows.filter((a) => ['open', 'both'].includes(a.audience));
      }
      return rows.sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));
    }

    if (q.includes('FROM practice_videos')) {
      let rows = [...db.practice_videos];
      if (q.includes('WHERE student_id = ?')) {
        const studentId = Number(params[0]);
        rows = rows.filter((v) => Number(v.student_id) === studentId);
      }
      return rows.sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));
    }

    if (q.includes('FROM practice_materials')) {
      let rows = [...db.practice_materials];
      if (q.includes('WHERE is_public = ?')) {
        const pub = Number(params[0]);
        rows = rows.filter((m) => (m.is_public ?? 1) === pub);
      }
      return rows.sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));
    }

    if (q.includes('FROM idioms_phrases')) {
      let rows = [...db.idioms_phrases];
      if (q.includes('WHERE is_public = ?')) {
        const pub = Number(params[0]);
        rows = rows.filter((i) => (i.is_public ?? 1) === pub);
      }
      return rows.sort((x, y) => String(x.phrase || '').localeCompare(String(y.phrase || '')));
    }

    if (q.includes('FROM doubts')) {
      let rows = [...db.doubts];
      if (q.includes('WHERE student_id = ?')) {
        const studentId = Number(params[0]);
        rows = rows.filter((d) => Number(d.student_id) === studentId);
      }
      return rows.sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));
    }

    if (q.includes('FROM notifications WHERE user_id = ?')) {
      const userId = Number(params[0]);
      return db.notifications
        .filter((n) => Number(n.user_id) === userId)
        .sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)))
        .slice(0, 50);
    }

    if (q.includes('FROM schedules')) {
      return [...db.schedules].sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));
    }

    return [];
  },

  async get(sql: string, params: any[] = []): Promise<any | null> {
    const db = loadDb();
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.includes('FROM profiles WHERE username = ? AND password = ?')) {
      const [username, password] = params;
      const u = db.profiles.find((p) => p.username === username && p.password === password);
      if (!u) return null;
      return { id: u.id, username: u.username, role: u.role, name: u.name };
    }

    if (q.includes('FROM profiles WHERE id = ?')) {
      const id = Number(params[0]);
      return db.profiles.find((p) => Number(p.id) === id) || null;
    }

    if (q.includes('FROM attendance WHERE student_id = ? AND date = ?')) {
      const [studentId, date] = params;
      return db.attendance.find((a) => Number(a.student_id) === Number(studentId) && a.date === date) || null;
    }

    if (q.includes('FROM practice_videos WHERE id = ?')) {
      const id = Number(params[0]);
      return db.practice_videos.find((v) => Number(v.id) === id) || null;
    }

    if (q.includes('FROM practice_materials WHERE id = ?')) {
      const id = Number(params[0]);
      return db.practice_materials.find((m) => Number(m.id) === id) || null;
    }

    if (q.includes('FROM idioms_phrases WHERE id = ?')) {
      const id = Number(params[0]);
      return db.idioms_phrases.find((i) => Number(i.id) === id) || null;
    }

    if (q.includes('FROM doubts WHERE id = ?')) {
      const id = Number(params[0]);
      return db.doubts.find((d) => Number(d.id) === id) || null;
    }

    return null;
  },

  async run(sql: string, params: any[] = []): Promise<{ id?: number; changes?: number }> {
    const db = loadDb();
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.startsWith('CREATE TABLE')) {
      return { changes: 0 };
    }

    // Notifications
    if (q.startsWith('INSERT INTO notifications')) {
      const [user_id, title, message, link, read] = params;
      const item = {
        id: nextId(db.notifications),
        created_at: new Date().toISOString(),
        user_id: Number(user_id),
        title,
        message,
        link: link || '',
        read: read ?? 0,
      };
      db.notifications.push(item);
      saveDb(db);
      return { id: item.id, changes: 1 };
    }

    if (q.startsWith('UPDATE notifications SET read = 1 WHERE user_id = ?')) {
      const userId = Number(params[0]);
      db.notifications.forEach((n) => {
        if (Number(n.user_id) === userId) n.read = 1;
      });
      saveDb(db);
      return { changes: 1 };
    }

    // Profiles
    if (q.startsWith('INSERT INTO profiles')) {
      const [username, password, role, name] = params;
      if (db.profiles.some((p) => p.username === username)) {
        throw new Error('UNIQUE constraint failed: profiles.username');
      }
      const item = {
        id: nextId(db.profiles),
        created_at: new Date().toISOString(),
        username,
        password,
        role,
        name,
      };
      db.profiles.push(item);
      saveDb(db);
      return { id: item.id, changes: 1 };
    }

    if (q.startsWith('UPDATE profiles SET name = ?, username = ?, password = ?, role = ? WHERE id = ?')) {
      const [name, username, password, role, id] = params;
      const prof = db.profiles.find((p) => Number(p.id) === Number(id));
      if (prof) {
        prof.name = name;
        prof.username = username;
        prof.password = password;
        prof.role = role;
        saveDb(db);
      }
      return { changes: prof ? 1 : 0 };
    }

    if (q.startsWith('UPDATE profiles SET name = ?, username = ?, role = ? WHERE id = ?')) {
      const [name, username, role, id] = params;
      const prof = db.profiles.find((p) => Number(p.id) === Number(id));
      if (prof) {
        prof.name = name;
        prof.username = username;
        prof.role = role;
        saveDb(db);
      }
      return { changes: prof ? 1 : 0 };
    }

    if (q.startsWith('DELETE FROM profiles WHERE id = ?')) {
      const id = Number(params[0]);
      db.profiles = db.profiles.filter((p) => Number(p.id) !== id);
      saveDb(db);
      return { changes: 1 };
    }

    // Attendance
    if (q.startsWith('UPDATE attendance SET status = ?, marked_by = ? WHERE id = ?')) {
      const [status, marked_by, id] = params;
      const rec = db.attendance.find((a) => Number(a.id) === Number(id));
      if (rec) {
        rec.status = status;
        rec.marked_by = marked_by;
        saveDb(db);
      }
      return { changes: rec ? 1 : 0 };
    }

    if (q.startsWith('INSERT INTO attendance')) {
      const [student_id, date, status, marked_by] = params;
      const item = {
        id: nextId(db.attendance),
        created_at: new Date().toISOString(),
        student_id: Number(student_id),
        date,
        status,
        marked_by: Number(marked_by),
      };
      db.attendance.push(item);
      saveDb(db);
      return { id: item.id, changes: 1 };
    }

    if (q.startsWith('DELETE FROM attendance WHERE id = ?')) {
      const id = Number(params[0]);
      db.attendance = db.attendance.filter((a) => Number(a.id) !== id);
      saveDb(db);
      return { changes: 1 };
    }

    // Announcements
    if (q.startsWith('INSERT INTO announcements')) {
      const [title, content, url, audience] = params;
      const item = {
        id: nextId(db.announcements),
        created_at: new Date().toISOString(),
        title,
        content,
        url,
        audience,
      };
      db.announcements.push(item);
      saveDb(db);
      return { id: item.id, changes: 1 };
    }

    if (q.startsWith('UPDATE announcements SET title = ?, content = ?, url = ?, audience = ? WHERE id = ?')) {
      const [title, content, url, audience, id] = params;
      const ann = db.announcements.find((a) => Number(a.id) === Number(id));
      if (ann) {
        ann.title = title;
        ann.content = content;
        ann.url = url;
        ann.audience = audience;
        saveDb(db);
      }
      return { changes: ann ? 1 : 0 };
    }

    if (q.startsWith('DELETE FROM announcements WHERE id = ?')) {
      const id = Number(params[0]);
      db.announcements = db.announcements.filter((a) => Number(a.id) !== id);
      saveDb(db);
      return { changes: 1 };
    }

    // Practice Videos
    if (q.startsWith('INSERT INTO practice_videos')) {
      const [student_id, student_name, video_url, title, description] = params;
      const item = {
        id: nextId(db.practice_videos),
        created_at: new Date().toISOString(),
        student_id: Number(student_id),
        student_name,
        video_url,
        title,
        description,
        feedback_text: '',
      };
      db.practice_videos.push(item);
      saveDb(db);
      return { id: item.id, changes: 1 };
    }

    if (q.startsWith('UPDATE practice_videos SET feedback_text = ? WHERE id = ?')) {
      const [feedback_text, id] = params;
      const vid = db.practice_videos.find((v) => Number(v.id) === Number(id));
      if (vid) {
        vid.feedback_text = feedback_text;
        saveDb(db);
      }
      return { changes: vid ? 1 : 0 };
    }

    if (q.startsWith('UPDATE practice_videos SET title = ?, video_url = ?, description = ? WHERE id = ?')) {
      const [title, video_url, description, id] = params;
      const vid = db.practice_videos.find((v) => Number(v.id) === Number(id));
      if (vid) {
        vid.title = title;
        vid.video_url = video_url;
        vid.description = description;
        saveDb(db);
      }
      return { changes: vid ? 1 : 0 };
    }

    if (q.startsWith('DELETE FROM practice_videos WHERE id = ?')) {
      const id = Number(params[0]);
      db.practice_videos = db.practice_videos.filter((v) => Number(v.id) !== id);
      saveDb(db);
      return { changes: 1 };
    }

    // Practice Materials
    if (q.startsWith('INSERT INTO practice_materials')) {
      const [category, title, content, url, image_url, is_public] = params;
      const item = {
        id: nextId(db.practice_materials),
        created_at: new Date().toISOString(),
        category,
        title,
        content,
        url,
        image_url,
        is_public,
      };
      db.practice_materials.push(item);
      saveDb(db);
      return { id: item.id, changes: 1 };
    }

    if (q.startsWith('UPDATE practice_materials SET category = ?, title = ?, content = ?, url = ?, image_url = ?, is_public = ? WHERE id = ?')) {
      const [category, title, content, url, image_url, is_public, id] = params;
      const mat = db.practice_materials.find((m) => Number(m.id) === Number(id));
      if (mat) {
        mat.category = category;
        mat.title = title;
        mat.content = content;
        mat.url = url;
        mat.image_url = image_url;
        mat.is_public = is_public;
        saveDb(db);
      }
      return { changes: mat ? 1 : 0 };
    }

    if (q.startsWith('UPDATE practice_materials SET is_public = ? WHERE id = ?')) {
      const [is_public, id] = params;
      const mat = db.practice_materials.find((m) => Number(m.id) === Number(id));
      if (mat) {
        mat.is_public = is_public;
        saveDb(db);
      }
      return { changes: mat ? 1 : 0 };
    }

    if (q.startsWith('DELETE FROM practice_materials WHERE id = ?')) {
      const id = Number(params[0]);
      db.practice_materials = db.practice_materials.filter((m) => Number(m.id) !== id);
      saveDb(db);
      return { changes: 1 };
    }

    // Idioms
    if (q.startsWith('INSERT INTO idioms_phrases')) {
      const [phrase, meaning, usage, is_public] = params;
      const item = {
        id: nextId(db.idioms_phrases),
        created_at: new Date().toISOString(),
        phrase,
        meaning,
        usage,
        is_public,
      };
      db.idioms_phrases.push(item);
      saveDb(db);
      return { id: item.id, changes: 1 };
    }

    if (q.startsWith('UPDATE idioms_phrases SET phrase = ?, meaning = ?, usage = ?, is_public = ? WHERE id = ?')) {
      const [phrase, meaning, usage, is_public, id] = params;
      const idiom = db.idioms_phrases.find((i) => Number(i.id) === Number(id));
      if (idiom) {
        idiom.phrase = phrase;
        idiom.meaning = meaning;
        idiom.usage = usage;
        idiom.is_public = is_public;
        saveDb(db);
      }
      return { changes: idiom ? 1 : 0 };
    }

    if (q.startsWith('UPDATE idioms_phrases SET is_public = ? WHERE id = ?')) {
      const [is_public, id] = params;
      const idiom = db.idioms_phrases.find((i) => Number(i.id) === Number(id));
      if (idiom) {
        idiom.is_public = is_public;
        saveDb(db);
      }
      return { changes: idiom ? 1 : 0 };
    }

    if (q.startsWith('DELETE FROM idioms_phrases WHERE id = ?')) {
      const id = Number(params[0]);
      db.idioms_phrases = db.idioms_phrases.filter((i) => Number(i.id) !== id);
      saveDb(db);
      return { changes: 1 };
    }

    // Doubts
    if (q.startsWith('INSERT INTO doubts')) {
      const [student_id, student_name, question] = params;
      const item = {
        id: nextId(db.doubts),
        created_at: new Date().toISOString(),
        student_id: Number(student_id),
        student_name,
        question,
      };
      db.doubts.push(item);
      saveDb(db);
      return { id: item.id, changes: 1 };
    }

    if (q.startsWith('UPDATE doubts SET solution = ?, solved_at = CURRENT_TIMESTAMP WHERE id = ?')) {
      const [solution, id] = params;
      const doubt = db.doubts.find((d) => Number(d.id) === Number(id));
      if (doubt) {
        doubt.solution = solution;
        doubt.solved_at = new Date().toISOString();
        saveDb(db);
      }
      return { changes: doubt ? 1 : 0 };
    }

    if (q.startsWith('UPDATE doubts SET question = ?, solution = ? WHERE id = ?')) {
      const [question, solution, id] = params;
      const doubt = db.doubts.find((d) => Number(d.id) === Number(id));
      if (doubt) {
        doubt.question = question;
        doubt.solution = solution;
        saveDb(db);
      }
      return { changes: doubt ? 1 : 0 };
    }

    if (q.startsWith('UPDATE doubts SET question = ? WHERE id = ?')) {
      const [question, id] = params;
      const doubt = db.doubts.find((d) => Number(d.id) === Number(id));
      if (doubt) {
        doubt.question = question;
        saveDb(db);
      }
      return { changes: doubt ? 1 : 0 };
    }

    if (q.startsWith('DELETE FROM doubts WHERE id = ?')) {
      const id = Number(params[0]);
      db.doubts = db.doubts.filter((d) => Number(d.id) !== id);
      saveDb(db);
      return { changes: 1 };
    }

    // Schedules
    if (q.startsWith('INSERT INTO schedules')) {
      const [slot_time, is_booked, booked_by_name] = params;
      const item = {
        id: nextId(db.schedules),
        created_at: new Date().toISOString(),
        slot_time,
        is_booked,
        booked_by_name,
      };
      db.schedules.push(item);
      saveDb(db);
      return { id: item.id, changes: 1 };
    }

    if (q.startsWith('UPDATE schedules SET slot_time = ?, is_booked = ?, booked_by_name = ? WHERE id = ?')) {
      const [slot_time, is_booked, booked_by_name, id] = params;
      const sched = db.schedules.find((s) => Number(s.id) === Number(id));
      if (sched) {
        sched.slot_time = slot_time;
        sched.is_booked = is_booked;
        sched.booked_by_name = booked_by_name;
        saveDb(db);
      }
      return { changes: sched ? 1 : 0 };
    }

    if (q.startsWith('UPDATE schedules SET is_booked = 1, booked_by_name = ? WHERE id = ?')) {
      const [booked_by_name, id] = params;
      const sched = db.schedules.find((s) => Number(s.id) === Number(id));
      if (sched) {
        sched.is_booked = 1;
        sched.booked_by_name = booked_by_name;
        saveDb(db);
      }
      return { changes: sched ? 1 : 0 };
    }

    if (q.startsWith('DELETE FROM schedules WHERE id = ?')) {
      const id = Number(params[0]);
      db.schedules = db.schedules.filter((s) => Number(s.id) !== id);
      saveDb(db);
      return { changes: 1 };
    }

    return { changes: 0 };
  },
};
