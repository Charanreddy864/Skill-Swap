import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { setUser } from '../../redux/actions/userActions';

const Profile = () => {
  const currentUser = useSelector((state) => state);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [skillOptions, setSkillOptions] = useState([]);
  const [showAddSkillHave, setShowAddSkillHave] = useState(false);
  const [showAddSkillWant, setShowAddSkillWant] = useState(false);
  const [newSkillsHave, setNewSkillsHave] = useState([]);
  const [newSkillsWant, setNewSkillsWant] = useState([]);
  const [skillDetails, setSkillDetails] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    location: '',
    profilePicture: '',
    age: '',
    contact: ''
  });

  useEffect(() => {
    // Fetch latest profile data
    fetchProfile();
    // Fetch skill options
    fetchSkills();
  }, []);

  // Auto-hide success message after 1 second
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchSkills = async () => {
    try {
      const response = await fetch('http://localhost:8000/skills');
      const data = await response.json();
      setSkillOptions(
        data.map(skill => ({ value: skill._id, label: skill.skillName }))
      );
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/users/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setUser(data.user));
        setFormData({
          fullName: data.user.fullName || '',
          bio: data.user.bio || '',
          location: data.user.location || '',
          profilePicture: data.user.profilePicture || '',
          age: data.user.age || '',
          contact: data.user.contact || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update basic profile info
      const response = await fetch('http://localhost:8000/users/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setUser(data.user));
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsEditing(false);
        setShowAddSkillHave(false);
        setShowAddSkillWant(false);
        setNewSkillsHave([]);
        setNewSkillsWant([]);
        setSkillDetails({});
        setSuccessMessage('Profile updated successfully!');
      } else {
        setSuccessMessage('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSuccessMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkillsHave = async () => {
    if (newSkillsHave.length === 0) {
      setSuccessMessage('Please select at least one skill to add');
      return;
    }

    setSaving(true);
    try {
      const formattedSkills = newSkillsHave.map(skillId => ({
        skill: skillId,
        skillLevel: skillDetails[skillId]?.level || 5
      }));

      const response = await fetch('http://localhost:8000/users/skills/add', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillsHave: formattedSkills })
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setUser(data.user));
        setNewSkillsHave([]);
        setSkillDetails({});
        setShowAddSkillHave(false);
        setSuccessMessage('Skills added successfully!');
      } else {
        setSuccessMessage('Failed to add skills');
      }
    } catch (error) {
      console.error('Error adding skills:', error);
      setSuccessMessage('Error adding skills');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkillsWant = async () => {
    if (newSkillsWant.length === 0) {
      setSuccessMessage('Please select at least one skill to add');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('http://localhost:8000/users/skills/add', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillsWant: newSkillsWant })
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setUser(data.user));
        setNewSkillsWant([]);
        setShowAddSkillWant(false);
        setSuccessMessage('Skills added successfully!');
      } else {
        setSuccessMessage('Failed to add skills');
      }
    } catch (error) {
      console.error('Error adding skills:', error);
      setSuccessMessage('Error adding skills');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkillHave = async (skillId) => {
    if (!window.confirm('Are you sure you want to remove this skill?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/users/skills/remove', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillHaveId: skillId })
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setUser(data.user));
        setSuccessMessage('Skill removed successfully!');
      } else {
        setSuccessMessage('Failed to remove skill');
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      setSuccessMessage('Error removing skill');
    }
  };

  const handleRemoveSkillWant = async (skillId) => {
    if (!window.confirm('Are you sure you want to remove this skill?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/users/skills/remove', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillWantId: skillId })
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setUser(data.user));
        setSuccessMessage('Skill removed successfully!');
      } else {
        setSuccessMessage('Failed to remove skill');
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      setSuccessMessage('Error removing skill');
    }
  };

  const updateSkillDetail = (skillId, field, value) => {
    setSkillDetails(prev => ({
      ...prev,
      [skillId]: { ...prev[skillId], [field]: value }
    }));
  };

  const handleCancel = () => {
    setFormData({
      fullName: currentUser.fullName || '',
      bio: currentUser.bio || '',
      location: currentUser.location || '',
      profilePicture: currentUser.profilePicture || '',
      age: currentUser.age || '',
      contact: currentUser.contact || ''
    });
    setIsEditing(false);
    setShowAddSkillHave(false);
    setShowAddSkillWant(false);
    setNewSkillsHave([]);
    setNewSkillsWant([]);
    setSkillDetails({});
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setSuccessMessage('Please type DELETE to confirm account deletion');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/users/delete-account', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear local storage
        localStorage.removeItem('user');
        // Redirect to landing page
        setSuccessMessage('Your account has been deleted successfully');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setSuccessMessage('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setSuccessMessage('Error deleting account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-green-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">My Profile</h1>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Profile Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          
          {/* Profile Picture Section */}
          <div className="px-8 pb-8">
            <div className="flex items-end gap-6 -mt-20 mb-6">
              <div className="relative">
                {formData.profilePicture ? (
                  <img
                    src={formData.profilePicture}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center rounded-full font-bold text-5xl border-4 border-white shadow-xl">
                    {currentUser.userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 mt-4">
                <h2 className="text-3xl font-bold text-white">{currentUser.userName}</h2>
                <p className="text-gray-600 mt-1">{currentUser.email}</p>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Member since {new Date(currentUser.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 font-medium shadow-md hover:shadow-lg"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>

          {/* Profile Fields */}
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-gray-800 py-2">
                  {currentUser.fullName || <span className="text-gray-400 italic">Not provided</span>}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-800 py-2">
                  {currentUser.bio || <span className="text-gray-400 italic">No bio yet</span>}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, Country"
                />
              ) : (
                <p className="text-gray-800 py-2">
                  {currentUser.location || <span className="text-gray-400 italic">Not provided</span>}
                </p>
              )}
            </div>

            {/* Profile Picture URL */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture URL
                </label>
                <input
                  type="text"
                  name="profilePicture"
                  value={formData.profilePicture}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a URL to an image to use as your profile picture
                </p>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your age"
                    min="1"
                    max="120"
                  />
                ) : (
                  <p className="text-gray-800 py-2">
                    {currentUser.age || <span className="text-gray-400 italic">Not provided</span>}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <p className="text-gray-800 py-2">
                  {currentUser.gender || <span className="text-gray-400 italic">Not provided</span>}
                </p>
              </div>
            </div>

            {/* Contact */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your contact number"
                />
              </div>
            )}

            {/* Skills Section */}
            <div className="pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Skills I Have</h3>
                <button
                  onClick={() => setShowAddSkillHave(!showAddSkillHave)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="text-xl font-bold">+</span>
                  Add Skill
                </button>
              </div>

              {/* Add New Skills Form */}
              {showAddSkillHave && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select skills to add
                  </label>
                  <Select
                    options={skillOptions.filter(opt => 
                      !currentUser.skillsHave?.some(sh => sh.skill?._id === opt.value)
                    )}
                    isMulti
                    onChange={(selected) => {
                      const values = selected.map(option => option.value);
                      setNewSkillsHave(values);
                      // Initialize skill details
                      const updatedDetails = { ...skillDetails };
                      values.forEach(skillId => {
                        if (!updatedDetails[skillId]) {
                          updatedDetails[skillId] = { level: 5 };
                        }
                      });
                      setSkillDetails(updatedDetails);
                    }}
                    placeholder="Select skills you have"
                    value={skillOptions.filter(option => newSkillsHave.includes(option.value))}
                  />
                  
                  {/* Skill Level Selection */}
                  {newSkillsHave.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {newSkillsHave.map(skillId => {
                        const skillName = skillOptions.find(s => s.value === skillId)?.label || '';
                        return (
                          <div key={skillId} className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between">
                            <h4 className="font-medium text-gray-800">{skillName}</h4>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">Level:</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={skillDetails[skillId]?.level || 5}
                                onChange={e => updateSkillDetail(skillId, 'level', e.target.value)}
                                className="w-16 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleAddSkillsHave}
                      disabled={saving || newSkillsHave.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {saving ? 'Adding...' : 'Add Skills'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddSkillHave(false);
                        setNewSkillsHave([]);
                        setSkillDetails({});
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {currentUser.skillsHave && currentUser.skillsHave.length > 0 ? (
                  currentUser.skillsHave.map((skillObj, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      <span>
                        {skillObj.skill?.skillName || 'Unknown'} (Level {skillObj.skillLevel || 'N/A'})
                      </span>
                      <button
                        onClick={() => handleRemoveSkillHave(skillObj._id)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                        title="Remove skill"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic">No skills added yet</p>
                )}
              </div>
            </div>

            <div className="pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Skills I Want to Learn</h3>
                <button
                  onClick={() => setShowAddSkillWant(!showAddSkillWant)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="text-xl font-bold">+</span>
                  Add Skill
                </button>
              </div>

              {/* Add New Skills Form */}
              {showAddSkillWant && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select skills to learn
                  </label>
                  <Select
                    options={skillOptions.filter(opt => 
                      !currentUser.skillsWant?.some(sw => sw._id === opt.value) &&
                      !currentUser.skillsHave?.some(sh => sh.skill?._id === opt.value)
                    )}
                    isMulti
                    onChange={(selected) => setNewSkillsWant(selected.map(option => option.value))}
                    placeholder="Select skills you want to learn"
                    value={skillOptions.filter(option => newSkillsWant.includes(option.value))}
                  />

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleAddSkillsWant}
                      disabled={saving || newSkillsWant.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {saving ? 'Adding...' : 'Add Skills'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddSkillWant(false);
                        setNewSkillsWant([]);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {currentUser.skillsWant && currentUser.skillsWant.length > 0 ? (
                  currentUser.skillsWant.map((skill, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      <span>{skill.skillName || 'Unknown'}</span>
                      <button
                        onClick={() => handleRemoveSkillWant(skill._id)}
                        className="text-green-600 hover:text-green-800 font-bold"
                        title="Remove skill"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic">No learning goals yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone - Delete Account */}
          <div className="mt-8 pt-8 border-t border-red-200 px-8">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
            <p className="text-gray-600 text-sm mb-4">
              Once you delete your account, there is no going back. This action will permanently delete your account, remove you from all friend lists, and delete all your data.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Delete Account</h2>
            <p className="text-gray-700 mb-4">
              Are you absolutely sure you want to delete your account? This action cannot be undone and will:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
              <li>Permanently delete your profile</li>
              <li>Remove you from all friend lists</li>
              <li>Delete all your messages and conversations</li>
              <li>Remove you from all skill pools</li>
              <li>Delete all your friend requests</li>
            </ul>
            <p className="text-gray-700 mb-4 font-medium">
              Type <span className="text-red-600 font-bold">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 mb-6"
              placeholder="Type DELETE"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
