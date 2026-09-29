import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Search, Tag, Star, Trash2, Edit3, Save, X,
  Volume2, ChevronDown, ChevronUp, Filter, Sparkles
} from 'lucide-react';
import { fetchStories, saveStory, updateStory, deleteStory } from '../services/api';

const COMPETENCY_COLORS = {
  'Problem Solving': 'bg-[#0A84FF]/15 text-[#0A84FF] border-[#0A84FF]/25',
  'Communication & Clarity': 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/25',
  'Technical Depth & Domain Mastery': 'bg-[#BF5AF2]/15 text-[#BF5AF2] border-[#BF5AF2]/25',
  'Ownership & Accountability': 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/25',
  'Teamwork & Conflict Resolution': 'bg-[#FF375F]/15 text-[#FF375F] border-[#FF375F]/25',
};

function getCompetencyClass(competency) {
  return COMPETENCY_COLORS[competency] || 'bg-white/[0.06] text-[#98989D] border-white/[0.08]';
}

export default function StoryBank({ candidate }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompetency, setFilterCompetency] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStory, setNewStory] = useState({
    title: '', situation: '', task: '', action: '', result: '',
    competency: '', tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const candidateId = candidate?.candidate_id || 'candidate_001';
  const ttsSupported = 'speechSynthesis' in window;

  useEffect(() => {
    loadStories();
  }, [candidateId]);

  const loadStories = async () => {
    setLoading(true);
    try {
      const data = await fetchStories(candidateId);
      setStories(data.stories || []);
    } catch (err) {
      console.warn('Failed to load stories:', err);
    }
    setLoading(false);
  };

  const handleSaveNew = async () => {
    if (!newStory.title.trim()) return;
    try {
      await saveStory(candidateId, {
        ...newStory,
        tags: newStory.tags,
      });
      setShowAddForm(false);
      setNewStory({ title: '', situation: '', task: '', action: '', result: '', competency: '', tags: [] });
      loadStories();
    } catch (err) {
      console.warn('Failed to save story:', err);
    }
  };

  const handleUpdate = async (storyId) => {
    try {
      await updateStory(candidateId, storyId, editForm);
      setEditingId(null);
      loadStories();
    } catch (err) {
      console.warn('Failed to update story:', err);
    }
  };

  const handleDelete = async (storyId) => {
    try {
      await deleteStory(candidateId, storyId);
      loadStories();
    } catch (err) {
      console.warn('Failed to delete story:', err);
    }
  };

  const speakText = (text) => {
    if (!ttsSupported || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const addTag = () => {
    if (tagInput.trim() && !newStory.tags.includes(tagInput.trim())) {
      setNewStory(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setNewStory(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  // Filter stories
  const filteredStories = stories.filter(s => {
    const matchesSearch = !searchQuery ||
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.situation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.action?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompetency = !filterCompetency || s.competency === filterCompetency;
    return matchesSearch && matchesCompetency;
  });

  const uniqueCompetencies = [...new Set(stories.map(s => s.competency).filter(Boolean))];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#FF9F0A]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Career Story Bank</h1>
            <p className="text-xs text-[#98989D]">{stories.length} STAR stories saved</p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-medium px-4 py-2 rounded-full flex items-center space-x-1.5 transition active:scale-[0.98]">
          <Plus className="w-3.5 h-3.5" /> <span>Add Story</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]" />
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search stories..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-[#636366] focus:outline-none focus:border-[#0A84FF] transition"
          />
        </div>
        {uniqueCompetencies.length > 0 && (
          <select value={filterCompetency} onChange={e => setFilterCompetency(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#0A84FF] transition appearance-none">
            <option value="">All Competencies</option>
            {uniqueCompetencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Add Story Form */}
      {showAddForm && (
        <div className="bg-white/[0.04] border border-[#0A84FF]/30 rounded-3xl p-6 mb-6 backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">New STAR Story</h3>
            <button onClick={() => setShowAddForm(false)} className="text-[#98989D] hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <input value={newStory.title} onChange={e => setNewStory(p => ({ ...p, title: e.target.value }))}
              placeholder="Story title (e.g., 'Redis Caching Optimization')"
              className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-3 text-sm text-white placeholder-[#636366] focus:outline-none focus:border-[#0A84FF] transition" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <textarea rows={3} value={newStory.situation} onChange={e => setNewStory(p => ({ ...p, situation: e.target.value }))}
                placeholder="Situation — What was the context?"
                className="bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-3 text-sm text-white placeholder-[#636366] focus:outline-none focus:border-[#0A84FF] transition" />
              <textarea rows={3} value={newStory.task} onChange={e => setNewStory(p => ({ ...p, task: e.target.value }))}
                placeholder="Task — What was your responsibility?"
                className="bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-3 text-sm text-white placeholder-[#636366] focus:outline-none focus:border-[#0A84FF] transition" />
              <textarea rows={3} value={newStory.action} onChange={e => setNewStory(p => ({ ...p, action: e.target.value }))}
                placeholder="Action — What did you specifically do?"
                className="bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-3 text-sm text-white placeholder-[#636366] focus:outline-none focus:border-[#0A84FF] transition" />
              <textarea rows={3} value={newStory.result} onChange={e => setNewStory(p => ({ ...p, result: e.target.value }))}
                placeholder="Result — What was the measurable outcome?"
                className="bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-3 text-sm text-white placeholder-[#636366] focus:outline-none focus:border-[#0A84FF] transition" />
            </div>

            <select value={newStory.competency} onChange={e => setNewStory(p => ({ ...p, competency: e.target.value }))}
              className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#0A84FF] transition appearance-none">
              <option value="">Select Competency</option>
              <option>Problem Solving</option>
              <option>Communication & Clarity</option>
              <option>Technical Depth & Domain Mastery</option>
              <option>Ownership & Accountability</option>
              <option>Teamwork & Conflict Resolution</option>
            </select>

            {/* Tags */}
            <div>
              <div className="flex items-center space-x-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tags (press Enter)"
                  className="flex-1 bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-3 text-sm text-white placeholder-[#636366] focus:outline-none focus:border-[#0A84FF] transition" />
                <button onClick={addTag} className="p-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#0A84FF] hover:bg-white/[0.1] transition">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {newStory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {newStory.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-white flex items-center space-x-1">
                      <span>{tag}</span>
                      <button onClick={() => removeTag(tag)} className="text-[#98989D] hover:text-[#FF453A]"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleSaveNew} disabled={!newStory.title.trim()}
              className="w-full bg-[#0A84FF] hover:bg-[#0071E3] text-white font-medium py-2.5 rounded-full text-sm transition disabled:opacity-40 flex items-center justify-center space-x-2">
              <Save className="w-4 h-4" /> <span>Save Story</span>
            </button>
          </div>
        </div>
      )}

      {/* Stories List */}
      {loading ? (
        <div className="text-center py-16 text-[#98989D] text-sm">Loading stories...</div>
      ) : filteredStories.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-[#636366] mx-auto mb-4" />
          <p className="text-sm text-[#98989D] mb-2">
            {stories.length === 0 ? 'No stories saved yet' : 'No matching stories found'}
          </p>
          <p className="text-xs text-[#636366]">
            {stories.length === 0
              ? 'Complete interview evaluations and save your best answers here'
              : 'Try adjusting your search or filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStories.map(story => {
            const isExpanded = expandedId === story.id;
            const isEditing = editingId === story.id;

            return (
              <div key={story.id}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-2xl transition hover:border-white/[0.14]">
                {/* Card header */}
                <div className="p-4 flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : story.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-semibold text-white truncate">{story.title}</h3>
                      {story.score && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/25 font-medium">
                          {Math.round(story.score)}/100
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      {story.competency && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getCompetencyClass(story.competency)}`}>
                          {story.competency}
                        </span>
                      )}
                      {story.tags?.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#98989D] border border-white/[0.08]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-3 shrink-0">
                    {ttsSupported && story.improved_version && (
                      <button onClick={e => { e.stopPropagation(); speakText(story.improved_version); }}
                        className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-[#0A84FF] transition" title="Hear improved version">
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#98989D]" /> : <ChevronDown className="w-4 h-4 text-[#98989D]" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.06] pt-3 space-y-3">
                    {isEditing ? (
                      /* Edit mode */
                      <div className="space-y-2">
                        <input value={editForm.title ?? story.title}
                          onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                          className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-[#0A84FF]" />
                        {['situation', 'task', 'action', 'result'].map(field => (
                          <textarea key={field} rows={2}
                            value={editForm[field] ?? story[field] ?? ''}
                            onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            className="w-full bg-[#1C1C1E] border border-white/[0.12] rounded-xl p-2.5 text-sm text-white placeholder-[#636366] focus:outline-none focus:border-[#0A84FF]" />
                        ))}
                        <div className="flex space-x-2">
                          <button onClick={() => handleUpdate(story.id)}
                            className="flex-1 bg-[#0A84FF] text-white text-xs py-2 rounded-full font-medium hover:bg-[#0071E3] transition flex items-center justify-center space-x-1">
                            <Save className="w-3.5 h-3.5" /> <span>Save</span>
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] text-xs text-[#98989D] rounded-full hover:text-white transition">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <>
                        {['situation', 'task', 'action', 'result'].map(field => story[field] && (
                          <div key={field}>
                            <span className="text-[10px] font-semibold text-[#0A84FF] uppercase tracking-wide">
                              {field === 'situation' ? '📍 Situation' : field === 'task' ? '🎯 Task' : field === 'action' ? '⚡ Action' : '📊 Result'}
                            </span>
                            <p className="text-xs text-[#C7C7CC] mt-0.5 leading-relaxed">{story[field]}</p>
                          </div>
                        ))}

                        {story.improved_version && (
                          <div className="p-3 rounded-2xl bg-[#0A84FF]/8 border border-[#0A84FF]/20">
                            <div className="flex items-center space-x-1.5 mb-1">
                              <Sparkles className="w-3 h-3 text-[#0A84FF]" />
                              <span className="text-[10px] font-semibold text-[#0A84FF] uppercase">Executive Rephrase</span>
                            </div>
                            <p className="text-xs text-[#C7C7CC] leading-relaxed">{story.improved_version}</p>
                          </div>
                        )}

                        {story.source_question && (
                          <p className="text-[10px] text-[#636366]">
                            <span className="font-medium">Source:</span> {story.source_question}
                          </p>
                        )}

                        <div className="flex items-center space-x-2 pt-1">
                          <button onClick={() => { setEditingId(story.id); setEditForm({}); }}
                            className="text-xs text-[#98989D] hover:text-white flex items-center space-x-1 transition">
                            <Edit3 className="w-3 h-3" /> <span>Edit</span>
                          </button>
                          <button onClick={() => handleDelete(story.id)}
                            className="text-xs text-[#98989D] hover:text-[#FF453A] flex items-center space-x-1 transition">
                            <Trash2 className="w-3 h-3" /> <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
