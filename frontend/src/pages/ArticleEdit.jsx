import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useBlocker } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Plus, Trash2, FileText, Globe, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import Editor from '../components/Editor.jsx';

export const ArticleEdit = () => {
  const { id } = useParams(); // Article ID (if editing)
  const isEditMode = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [references, setReferences] = useState([{ title: '', url: '' }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty: formIsDirty } } = useForm();

  const hasContentChanged = content !== initialContent;
  const isDirty = formIsDirty || hasContentChanged;

  // React Router SPA Navigation Blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !saving && currentLocation.pathname !== nextLocation.pathname
  );

  // Trigger confirm modal alert when navigation is blocked
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Please save your article before leaving the page. Are you sure you want to discard your edits and leave?"
      );
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // Native Browser tab close / reload warnings
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && !saving) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Please save your article before leaving the page. Are you sure you want to discard your edits and leave?";
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, saving]);

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        if (data.success) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  // Load Article details if editing
  useEffect(() => {
    if (!isEditMode) {
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      try {
        const { data } = await api.get(`/articles/${id}`);
        if (data.success && data.article) {
          const art = data.article;
          
          // Verify ownership or staff permissions
          const isOwner = user && art.author?._id === user._id;
          const isStaff = user && (user.role === 'Admin' || user.role === 'Moderator');
          if (!isOwner && !isStaff) {
            toast.error('You are not authorized to edit this article');
            navigate('/');
            return;
          }

          // Populate Form Fields (prevent marking dirty on load)
          setValue('title', art.title, { shouldDirty: false });
          setValue('category', art.category?._id || art.category, { shouldDirty: false });
          setValue('bannerImage', art.bannerImage, { shouldDirty: false });
          setValue('tags', art.tags?.join(', ') || '', { shouldDirty: false });
          setContent(art.content || '');
          setInitialContent(art.content || '');
          
          if (art.references && art.references.length > 0) {
            setReferences(art.references);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Could not fetch article details for editing');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, isEditMode, navigate, setValue, user]);

  const handleAddReference = () => {
    setReferences([...references, { title: '', url: '' }]);
  };

  const handleRemoveReference = (index) => {
    setReferences(references.filter((_, idx) => idx !== index));
  };

  const handleRefChange = (index, field, val) => {
    const updated = [...references];
    updated[index][field] = val;
    setReferences(updated);
  };

  const handleSave = async (data, publishStatus = 'Approved') => {
    if (!content.trim()) {
      toast.error('Article content cannot be empty!');
      return;
    }

    setSaving(true);
    const toastId = toast.loading(isEditMode ? 'Saving revisions...' : 'Creating article page...');

    // Filter out blank references
    const cleanReferences = references.filter(ref => ref.title.trim() !== '');

    const payload = {
      title: data.title,
      category: data.category,
      content,
      bannerImage: data.bannerImage || '',
      tags: data.tags,
      references: cleanReferences,
      summary: data.summary || '',
      status: publishStatus, // 'Draft' or 'Approved' (backend defaults students to 'Pending')
    };

    try {
      let res;
      if (isEditMode) {
        res = await api.patch(`/articles/${id}`, payload);
      } else {
        res = await api.post('/articles', payload);
      }

      if (res.data.success) {
        toast.success(
          publishStatus === 'Draft' 
            ? 'Saved to drafts!' 
            : (user.role === 'Student' || user.role === 'Guest') 
              ? 'Submitted! Pending moderator review.' 
              : 'Article page is now live!', 
          { id: toastId }
        );
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error occurred while saving', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-iitgn-maroon border-t-transparent"></div>
      </div>
    );
  }

  const isStudent = user && (user.role === 'Student' || user.role === 'Guest');

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-bold font-serif text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Article Page' : 'Create New Article Page'}
        </h1>
      </div>

      <form onSubmit={handleSubmit((data) => handleSave(data, 'Approved'))} className="space-y-6">
        
        {/* Core Inputs (Title & Category) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
              Article Title
            </label>
            <input
              id="title"
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
              placeholder="e.g. Computer Science Department"
            />
            {errors.title && <p className="mt-1 text-xs text-red-655">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
              Category
            </label>
            <select
              id="category"
              {...register('category', { required: 'Please select a category' })}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-655">{errors.category.message}</p>}
          </div>
        </div>

        {/* Media Banner Image URL */}
        <div>
          <label htmlFor="bannerImage" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
            Banner Image URL
          </label>
          <input
            id="bannerImage"
            type="text"
            {...register('bannerImage')}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
            placeholder="https://example.com/banner.jpg (Leave blank for default placeholder)"
          />
        </div>

        {/* Core Rich Editor */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-350 mb-1">
            Article Body Content
          </label>
          <Editor value={content} onChange={setContent} />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
            Tags (comma separated)
          </label>
          <input
            id="tags"
            type="text"
            {...register('tags')}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
            placeholder="CSE, Academics, Lab"
          />
        </div>

        {/* Bibliography References */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
            References & Bibliography
          </label>
          
          <div className="space-y-2">
            {references.map((ref, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={ref.title}
                  onChange={(e) => handleRefChange(idx, 'title', e.target.value)}
                  placeholder="Reference Title (e.g. Official Syllabus Document)"
                  className="flex-1 rounded-lg border border-gray-300 bg-white p-2 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
                />
                <input
                  type="text"
                  value={ref.url || ''}
                  onChange={(e) => handleRefChange(idx, 'url', e.target.value)}
                  placeholder="URL link (optional)"
                  className="flex-1 rounded-lg border border-gray-300 bg-white p-2 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveReference(idx)}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddReference}
            className="flex items-center gap-1.5 text-xs font-semibold text-iitgn-maroon hover:underline dark:text-red-400"
          >
            <Plus className="h-3.5 w-3.5" /> Add another reference
          </button>
        </div>

        {/* Edit Summary (Required for edits) */}
        {isEditMode && (
          <div>
            <label htmlFor="summary" className="block text-sm font-semibold text-gray-700 dark:text-slate-350">
              Revision Edit Summary <span className="text-red-500">*</span>
            </label>
            <input
              id="summary"
              type="text"
              {...register('summary', { required: 'Please describe your edits in the revision log' })}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-iitgn-maroon dark:border-slate-850 dark:bg-slate-950 dark:text-white"
              placeholder="e.g. Corrected room number and added research lab details."
            />
            {errors.summary && <p className="mt-1 text-xs text-red-655">{errors.summary.message}</p>}
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-slate-800">
          
          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold shadow-sm transition-all mr-auto"
          >
            Cancel
          </button>

          {/* Draft Button */}
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit((data) => handleSave(data, 'Draft'))}
            className="rounded border border-gray-200 bg-white hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800 px-4 py-2.5 text-sm font-semibold shadow-sm transition-all"
          >
            Save as Draft
          </button>

          {/* Submit/Publish Button */}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-iitgn-maroon hover:bg-iitgn-maroon-dark text-white px-5 py-2.5 text-sm font-semibold shadow transition-all"
          >
            <Save className="h-4 w-4" />
            <span>
              {isEditMode 
                ? 'Save Changes' 
                : isStudent 
                  ? 'Submit Page for Review' 
                  : 'Publish Page'
              }
            </span>
          </button>

        </div>

      </form>

    </div>
  );
};

export default ArticleEdit;
