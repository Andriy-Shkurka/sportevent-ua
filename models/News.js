const { pool } = require('../config/database');

class News {
  static async getAll({ page = 1, limit = 10, category = '', status = 'published', search = '', featured = false } = {}) {
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND n.status = ?'; params.push(status); }
    if (category) { where += ' AND n.category = ?'; params.push(category); }
    if (featured) { where += ' AND n.is_featured = TRUE'; }
    if (search) { where += ' AND (n.title LIKE ? OR n.excerpt LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [rows] = await pool.execute(
      `SELECT n.id, n.title, n.slug, n.excerpt, n.cover_image, n.category, n.status,
              n.views, n.is_featured, n.published_at, n.created_at,
              u.first_name as author_first, u.last_name as author_last,
              e.title as event_title, e.slug as event_slug
       FROM news n
       JOIN users u ON n.author_id = u.id
       LEFT JOIN events e ON n.event_id = e.id
       ${where} ORDER BY n.published_at DESC, n.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM news n ${where}`, params
    );

    return { news: rows, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async findBySlug(slug) {
    const [rows] = await pool.execute(
      `SELECT n.*, u.first_name as author_first, u.last_name as author_last, u.avatar as author_avatar,
              e.title as event_title, e.slug as event_slug
       FROM news n
       JOIN users u ON n.author_id = u.id
       LEFT JOIN events e ON n.event_id = e.id
       WHERE n.slug = ?`,
      [slug]
    );
    if (rows[0]) {
      await pool.execute('UPDATE news SET views = views + 1 WHERE id = ?', [rows[0].id]);
    }
    return rows[0] || null;
  }

  static async create(data) {
    const slug = await News.generateSlug(data.title);
    const [result] = await pool.execute(
      `INSERT INTO news (author_id, event_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.author_id, data.event_id || null, data.title, slug, data.excerpt || null,
       data.content, data.cover_image || null, data.category || 'news',
       data.status || 'draft', data.is_featured || false,
       data.status === 'published' ? new Date() : null]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const allowed = ['title', 'excerpt', 'content', 'cover_image', 'category', 'status', 'is_featured', 'event_id'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (data.status === 'published') {
      fields.push('published_at = COALESCE(published_at, NOW())');
    }
    if (!fields.length) return false;
    values.push(id);
    await pool.execute(`UPDATE news SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id) {
    await pool.execute('DELETE FROM news WHERE id = ?', [id]);
  }

  static async generateSlug(title) {
    let slug = title
      .toLowerCase()
      .replace(/[а-яёїіє]/g, c => ({ 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','є':'ye','ж':'zh','з':'z','и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ю':'yu','я':'ya' }[c] || c))
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    const [existing] = await pool.execute('SELECT slug FROM news WHERE slug LIKE ?', [`${slug}%`]);
    if (!existing.length) return slug;
    return `${slug}-${Date.now()}`;
  }
}

module.exports = News;
