import { FaCrown } from 'react-icons/fa';

const UserList = ({ users }) => {
  if (!users || Object.keys(users).length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-2 text-white">Users</h2>
        <p className="text-gray-400">No users in this room yet.</p>
      </div>
    );
  }

  // Convert users object to array and sort by host first, then by join time
  const userList = Object.entries(users)
    .map(([id, user]) => ({ id, ...user }))
    .sort((a, b) => {
      // Host comes first
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      
      // Then sort by join time
      return new Date(a.joinedAt) - new Date(b.joinedAt);
    });

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 text-white">Users in Room</h2>
      <ul className="space-y-3">
        {userList.map((user) => (
          <li 
            key={user.id}
            className="flex items-center p-3 bg-gray-800 rounded-lg"
          >
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center mr-3">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-white">{user.name}</span>
            {user.isHost && (
              <div className="ml-auto flex items-center text-yellow-500" title="Room Host">
                <FaCrown />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
