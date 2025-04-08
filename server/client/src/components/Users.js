import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { SERVER_API_PATH } from '../config';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${SERVER_API_PATH}/users`);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post(`${SERVER_API_PATH}/users`, newUser);
      setNewUser({ username: '', password: '' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creating user');
    }
  };

  const handleDeleteUser = async (username) => {
    if (window.confirm(`Are you sure you want to delete user ${username}?`)) {
      try {
        await axios.delete(`${SERVER_API_PATH}/users/${username}`);
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.msg || 'Error deleting user');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Create New User</h5>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleCreateUser}>
                <div className="mb-3">
                  <label htmlFor="newUsername" className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newUsername"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">Create User</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Users List</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.username}>
                        <td>{user.username}</td>
                        <td>{new Date(user.createdAt).toLocaleString()}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(user.username)}
                            disabled={user.isAdmin}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users; 