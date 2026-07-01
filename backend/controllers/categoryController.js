import Category from '../models/Category.js';
import slugify from 'slugify';

// @desc    Get all categories
// @route   GET /categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /categories
// @access  Private (Admin, Moderator)
export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400);
      return next(new Error('Category name is required'));
    }

    const slug = slugify(name, { lower: true, strict: true });

    // Check duplicate slug
    const duplicate = await Category.findOne({ slug });
    if (duplicate) {
      res.status(400);
      return next(new Error('A category with this name or slug already exists'));
    }

    const category = await Category.create({
      name,
      slug,
      description,
    });

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
// @route   PATCH /categories/:id
// @access  Private (Admin, Moderator)
export const updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    let category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      return next(new Error('Category not found'));
    }

    if (name) {
      category.name = name;
      category.slug = slugify(name, { lower: true, strict: true });
    }

    if (description !== undefined) {
      category.description = description;
    }

    await category.save();

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /categories/:id
// @access  Private (Admin, Moderator)
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404);
      return next(new Error('Category not found'));
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
