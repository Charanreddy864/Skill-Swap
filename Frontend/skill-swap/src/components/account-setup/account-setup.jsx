import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../redux/actions/userActions';
import { useDispatch } from 'react-redux';

const AccountSetup = () => {
  const dispatch = useDispatch();
  const [age, setAge] = useState(23);
  const [gender, setGender] = useState('Male');
  const [contact, setContact] = useState('');
  const [skillsHave, setSkillsHave] = useState([]);
  const [skillsWant, setSkillsWant] = useState([]);
  const [skillDetails, setSkillDetails] = useState({});
  const [skillOptions, setSkillOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/skills")
      .then(res => res.json())
      .then(data => {
        setSkillOptions(
          data.map(skill => ({ value: skill._id, label: skill.skillName }))
        );
      })
      .catch(err => console.error("Failed to fetch skills:", err));
  }, []);

  const handleHaveChange = (selectedOptions) => {
    const values = selectedOptions.map(option => option.value);
    setSkillsHave(values);

    // Ensure we track details for each selected skill
    const updatedDetails = { ...skillDetails };
    values.forEach(skillId => {
      if (!updatedDetails[skillId]) {
        updatedDetails[skillId] = { level: 5, description: '' };
      }
    });
    setSkillDetails(updatedDetails);
  };

  const updateSkillDetail = (skillId, field, value) => {
    setSkillDetails(prev => ({
      ...prev,
      [skillId]: { ...prev[skillId], [field]: value }
    }));
  };

  const handleSubmit = () => {
    const formattedSkillsHave = skillsHave.map(skillId => ({
      skill: skillId,
      skillLevel: skillDetails[skillId]?.level || 5,
      description: skillDetails[skillId]?.description || ''
    }));

    fetch("http://localhost:8000/users/account-setup", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: JSON.stringify({
        skillsHave: formattedSkillsHave,
        skillsWant,
        gender,
        age,
        contact,
      })
    })
      .then(response => {
        if (response.ok) {
          console.log("Account setup submitted successfully");    
          return response.json();
        } else {
          throw new Error("Failed to submit account setup");
        }
      })
      .then(data => {
        dispatch(setUser(data.user));
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate("/dashboard")
      })
      .catch(error => console.error(error));
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-black via-blue-950 to-black text-white p-8 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Complete Your Profile</h1>
          <p className="text-gray-400 text-lg">Tell us about your skills and what you'd like to learn</p>
        </div>
      
      <div className="w-full bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border border-purple-900 p-8 space-y-6">
        
        {/* Age & Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-cyan-300">Age</label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              className="w-full bg-gray-900 bg-opacity-50 border border-gray-700 rounded-lg px-4 py-3 text-cyan-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-cyan-300">Gender</label>
            <Select
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
              value={{ value: gender, label: gender }}
              onChange={(option) => setGender(option.value)}
              placeholder="Select gender"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: 'rgba(17, 24, 39, 0.5)',
                  borderColor: 'rgb(55, 65, 81)',
                  '&:hover': { borderColor: 'rgb(6, 182, 212)' },
                  boxShadow: 'none',
                  minHeight: '48px',
                }),
                menu: (base) => ({ ...base, backgroundColor: 'rgb(17, 24, 39)', borderColor: 'rgb(55, 65, 81)', border: '1px solid rgb(55, 65, 81)' }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? 'rgb(8, 145, 178)' : 'rgb(17, 24, 39)',
                  color: 'white',
                  '&:active': { backgroundColor: 'rgb(6, 182, 212)' }
                }),
                singleValue: (base) => ({ ...base, color: 'rgb(165, 243, 252)' }),
                placeholder: (base) => ({ ...base, color: 'rgb(156, 163, 175)' }),
                input: (base) => ({ ...base, color: 'white' }),
              }}
            />
          </div>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium mb-2 text-cyan-300">Contact</label>
          <input
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            className="w-full bg-gray-900 bg-opacity-50 border border-gray-700 rounded-lg px-4 py-3 text-cyan-100 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all"
            placeholder="Phone, email, etc."
          />
        </div>

        {/* Skills Have */}
        <div>
          <label className="block text-sm font-medium mb-2 text-cyan-300">Skills You Have</label>
          <Select
            options={skillOptions}
            isMulti
            onChange={handleHaveChange}
            placeholder="Select skills you have"
            value={skillOptions.filter(option => skillsHave.includes(option.value))}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: 'rgba(17, 24, 39, 0.5)',
                borderColor: 'rgb(55, 65, 81)',
                '&:hover': { borderColor: 'rgb(6, 182, 212)' },
                boxShadow: 'none',
              }),
              menu: (base) => ({ ...base, backgroundColor: 'rgb(17, 24, 39)', borderColor: 'rgb(55, 65, 81)', border: '1px solid rgb(55, 65, 81)' }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? 'rgb(8, 145, 178)' : 'rgb(17, 24, 39)',
                color: 'white',
                '&:active': { backgroundColor: 'rgb(6, 182, 212)' }
              }),
              multiValue: (base) => ({ ...base, backgroundColor: 'rgb(8, 145, 178)' }),
              multiValueLabel: (base) => ({ ...base, color: 'white' }),
              multiValueRemove: (base) => ({ ...base, color: 'white', '&:hover': { backgroundColor: 'rgb(6, 182, 212)', color: 'white' } }),
              input: (base) => ({ ...base, color: 'white' }),
              placeholder: (base) => ({ ...base, color: 'rgb(156, 163, 175)' }),
              singleValue: (base) => ({ ...base, color: 'white' }),
            }}
          />
          
          {/* Skill Details */}
          <div className="mt-4 space-y-4">
            {skillsHave.map(skillId => {
              const skillName = skillOptions.find(s => s.value === skillId)?.label || '';
              return (
                <div key={skillId} className="bg-gray-900 bg-opacity-50 border border-gray-700 p-4 rounded-lg flex items-center justify-between">
                  <h3 className="font-semibold text-cyan-300 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {skillName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-300">Level:</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={skillDetails[skillId]?.level || 5}
                      onChange={e => updateSkillDetail(skillId, 'level', e.target.value)}
                      className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-cyan-100 text-center focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skills Want */}
        <div>
          <label className="block text-sm font-medium mb-2 text-cyan-300">Skills You Want to Learn</label>
          <Select
            options={skillOptions.filter(option => !skillsHave.includes(option.value))}
            isMulti
            onChange={(selected) => setSkillsWant(selected.map(option => option.value))}
            placeholder="Select skills you want to learn"
            value={skillOptions.filter(option => skillsWant.includes(option.value))}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: 'rgba(17, 24, 39, 0.5)',
                borderColor: 'rgb(55, 65, 81)',
                '&:hover': { borderColor: 'rgb(6, 182, 212)' },
                boxShadow: 'none',
              }),
              menu: (base) => ({ ...base, backgroundColor: 'rgb(17, 24, 39)', borderColor: 'rgb(55, 65, 81)', border: '1px solid rgb(55, 65, 81)' }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? 'rgb(8, 145, 178)' : 'rgb(17, 24, 39)',
                color: 'white',
                '&:active': { backgroundColor: 'rgb(6, 182, 212)' }
              }),
              multiValue: (base) => ({ ...base, backgroundColor: 'rgb(34, 197, 94)' }),
              multiValueLabel: (base) => ({ ...base, color: 'white' }),
              multiValueRemove: (base) => ({ ...base, color: 'white', '&:hover': { backgroundColor: 'rgb(22, 163, 74)', color: 'white' } }),
              input: (base) => ({ ...base, color: 'white' }),
              placeholder: (base) => ({ ...base, color: 'rgb(156, 163, 175)' }),
              singleValue: (base) => ({ ...base, color: 'white' }),
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all duration-200 flex items-center justify-center space-x-2 mt-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Complete Setup</span>
        </button>
      </div>
      </div>
    </div>
  );
};

export default AccountSetup;
