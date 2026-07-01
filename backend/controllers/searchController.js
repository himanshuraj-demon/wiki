import Article from '../models/Article.js';

// @desc    Global search
// @route   GET /search
// @access  Public
export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(200).json({
        success: true,
        count: 0,
        articles: [],
      });
    }

    // Perform partial case-insensitive search on title, content, or tags
    const searchRegex = new RegExp(q, 'i');
    
    // Only search approved articles for public
    const query = {
      status: 'Approved',
      $or: [
        { title: searchRegex },
        { tags: searchRegex },
        { content: searchRegex },
      ],
    };

    const articles = await Article.find(query)
      .populate('category', 'name slug')
      .populate('author', 'name')
      .select('title slug category tags views readingTime updatedAt')
      .limit(20);

    // Form live suggestions array of matching titles
    const suggestions = articles.map(art => ({
      title: art.title,
      slug: art.slug,
      category: art.category?.name || 'Uncategorized',
    }));

    res.status(200).json({
      success: true,
      count: articles.length,
      suggestions,
      articles,
    });
  } catch (error) {
    next(error);
  }
};
