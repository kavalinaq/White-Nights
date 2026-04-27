import { useFollowRequests, useHandleFollowRequest } from './hooks/useFollow';

interface Props {
  onClose: () => void;
}

export const FollowRequestsModal = ({ onClose }: Props) => {
  const { data: requests, isLoading } = useFollowRequests();
  const { accept, reject } = useHandleFollowRequest();

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-content" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', color: 'black', width: '100%', maxWidth: '400px' }}>
        <h2>Follow Requests</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : requests?.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {requests.map((req: any) => (
              <li key={req.followerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span>{req.nickname}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => accept.mutate(req.followerId)}>Accept</button>
                  <button onClick={() => reject.mutate(req.followerId)} style={{ backgroundColor: '#ff4d4f' }}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose} style={{ marginTop: '1rem' }}>Close</button>
      </div>
    </div>
  );
};
