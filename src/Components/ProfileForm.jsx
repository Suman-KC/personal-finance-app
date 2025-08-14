import React from "react";

export default function ProfileForm({ profile, setProfile }) {
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, photo: reader.result }); // base64 string
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="card">
      <h2>👤 Profile</h2>
      <div className="profile-section">
        <div className="profile-photo">
          {profile.photo ? (
            <img src={profile.photo} alt="Profile" />
          ) : (
            <div className="placeholder">📷</div>
          )}
          <input type="file" accept="image/*" onChange={handlePhotoUpload} />
        </div>
        <div className="profile-info">
          <input
            name="name"
            value={profile.name}
            onChange={handleChange}
            placeholder="Name"
          />
          <input
            name="email"
            value={profile.email}
            onChange={handleChange}
            placeholder="Email"
          />
        </div>
      </div>
    </div>
  );
}
