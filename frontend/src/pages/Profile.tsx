import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Settings, Key, Star, Award, Check
} from 'lucide-react';

const INTEREST_OPTIONS = [
  'Solar Energy',
  'Plant-Based Diet',
  'Zero Waste',
  'Recycling',
  'Electric Vehicles',
  'Public Transit',
  'Composting',
  'Organic Farming'
];

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  // Profile form state
  const [age, setAge] = useState(user?.profile?.age || 0);
  const [country, setCountry] = useState(user?.profile?.country || '');
  const [city, setCity] = useState(user?.profile?.city || '');
  const [occupation, setOccupation] = useState(user?.profile?.occupation || '');
  const [householdSize, setHouseholdSize] = useState(user?.profile?.household_size || 1);
  const [transPref, setTransPref] = useState(user?.profile?.transportation_preference || 'Public Transit');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.profile?.sustainability_interests || []);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      await updateProfile({
        age: Number(age),
        country,
        city,
        occupation,
        household_size: Number(householdSize),
        transportation_preference: transPref,
        sustainability_interests: selectedInterests
      });
      alert('Profile updated successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    try {
      setPwdSaving(true);
      await api.auth.changePassword({ old_password: oldPassword, new_password: newPassword });
      alert('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update password.');
    } finally {
      setPwdSaving(false);
    }
  };

  const badgeIcons: Record<string, string> = {
    "Green Beginner": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
    "Carbon Reducer": "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-400",
    "Eco Warrior": "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400",
    "Sustainability Champion": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Profile Settings</h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
          Manage your personal details, sustainability preferences, and security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Profile details form (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-3 mb-6">
              <Settings className="w-5 h-5 text-eco-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personal Profile Details</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Full Name</label>
                  <input 
                    type="text" disabled value={user?.name || ''}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Email Address</label>
                  <input 
                    type="email" disabled value={user?.email || ''}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Age</label>
                  <input 
                    type="number" value={age || ''} onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Household Size</label>
                  <input 
                    type="number" value={householdSize} onChange={(e) => setHouseholdSize(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">City</label>
                  <input 
                    type="text" value={city} onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Country</label>
                  <input 
                    type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Occupation</label>
                  <input 
                    type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Transportation Preference</label>
                  <select 
                    value={transPref} onChange={(e) => setTransPref(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                  >
                    <option value="Bicycle">Bicycle</option>
                    <option value="Electric Vehicle">Electric Vehicle</option>
                    <option value="Public Transit">Public Transit</option>
                    <option value="Gasoline Car">Gasoline Car</option>
                  </select>
                </div>
              </div>

              {/* Sustainability Interests checks */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Sustainability Interests</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1.5">
                  {INTEREST_OPTIONS.map((interest) => {
                    const checked = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-2xs font-bold text-left transition-all ${
                          checked
                            ? 'bg-eco-500 text-white border-eco-500 shadow-md shadow-eco-600/5'
                            : 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span className="truncate mr-1">{interest}</span>
                        {checked && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                type="submit"
                disabled={profileSaving}
                className="eco-gradient text-white text-xs font-bold py-3 rounded-xl shadow-md shadow-eco-600/10 hover:shadow-lg mt-3 self-end px-8 disabled:opacity-50"
              >
                {profileSaving ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Column 2: Password Update & Achievements Shelf (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Achievements shelf */}
          <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              <Award className="w-5 h-5 text-amber-500 fill-amber-500/15" />
              <h3 className="font-bold text-slate-900 dark:text-white">Your Achievements</h3>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {!user?.badges || user.badges.length === 0 ? (
                <p className="text-xs text-slate-450 text-center py-4 font-semibold">No badges unlocked yet.</p>
              ) : (
                user.badges.map((badge, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-bold ${
                      badgeIcons[badge] || 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current shrink-0" />
                    <span className="truncate">{badge}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Change Password form */}
          <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              <Key className="w-5 h-5 text-eco-600" />
              <h3 className="font-bold text-slate-900 dark:text-white">Change Password</h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Current Password</label>
                <input 
                  type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-eco-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">New Password</label>
                <input 
                  type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-eco-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <input 
                  type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-eco-500 transition-colors"
                />
              </div>

              <button 
                type="submit"
                disabled={pwdSaving}
                className="eco-gradient text-white text-xs font-bold py-2.5 rounded-xl shadow-md shadow-eco-600/10 hover:shadow-lg mt-1 w-full disabled:opacity-50"
              >
                {pwdSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
