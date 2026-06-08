const prisma = require('../config/database');

const levels = ['BEGINNER', 'ADVANCED'];

const normalizeLesson = (lesson, canWatchPremium = false) => {
  const locked = lesson.isPremium && !canWatchPremium;
  return {
    ...lesson,
    locked,
    videoUrl: locked ? null : lesson.videoUrl,
  };
};

const userCanWatchPremium = async (userId) => {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  return subscription?.status === 'ACTIVE';
};

const listLessons = async (req, res, next) => {
  try {
    const level = String(req.query.level || '').toUpperCase();
    const downloaded = String(req.query.downloaded || '').toLowerCase() === 'true';
    const where = {
      isPublished: true,
      ...(downloaded ? { videoUrl: { startsWith: '/uploads/lessons/' } } : {}),
      ...(!downloaded && levels.includes(level) ? { level } : {}),
    };

    const [lessons, canWatchPremium] = await Promise.all([
      prisma.lesson.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: { author: { select: { username: true, email: true } } },
      }),
      userCanWatchPremium(req.user.id),
    ]);

    res.json({ lessons: lessons.map((lesson) => normalizeLesson(lesson, canWatchPremium)) });
  } catch (error) {
    next(error);
  }
};

const adminListLessons = async (_req, res, next) => {
  try {
    const lessons = await prisma.lesson.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { author: { select: { username: true, email: true } } },
    });
    res.json({ lessons });
  } catch (error) {
    next(error);
  }
};

const toLessonData = (body, authorId) => {
  const level = String(body.level || 'BEGINNER').toUpperCase();
  if (!levels.includes(level)) {
    const error = new Error('Зөв түвшин сонгоно уу: BEGINNER эсвэл ADVANCED.');
    error.statusCode = 400;
    throw error;
  }

  if (!String(body.title || '').trim()) {
    const error = new Error('Хичээлийн гарчиг оруулна уу.');
    error.statusCode = 400;
    throw error;
  }

  if (!String(body.videoUrl || '').trim()) {
    const error = new Error('Video URL оруулна уу.');
    error.statusCode = 400;
    throw error;
  }

  return {
    ...(authorId ? { authorId } : {}),
    title: String(body.title).trim(),
    description: body.description ? String(body.description).trim() : null,
    videoUrl: String(body.videoUrl).trim(),
    thumbnailUrl: body.thumbnailUrl ? String(body.thumbnailUrl).trim() : null,
    level,
    isPremium: Boolean(body.isPremium),
    duration: body.duration ? String(body.duration).trim() : null,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished),
  };
};

const createLesson = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.create({
      data: toLessonData(req.body, req.user.id),
    });
    res.status(201).json({ message: 'Хичээл нэмэгдлээ.', lesson });
  } catch (error) {
    next(error);
  }
};

const updateLesson = async (req, res, next) => {
  try {
    const data = toLessonData(req.body);
    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ message: 'Хичээл шинэчлэгдлээ.', lesson });
  } catch (error) {
    next(error);
  }
};

const deleteLesson = async (req, res, next) => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.id } });
    res.json({ message: 'Хичээл устгагдлаа.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listLessons,
  adminListLessons,
  createLesson,
  updateLesson,
  deleteLesson,
};
