import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ProfileSkeleton = () => {
    return (
        <SkeletonTheme baseColor="#f3f4f6" highlightColor="#ffffff">
            <div className="profile-page-container">
                <div className="profile-page-header">
                    <Skeleton width={200} height={32} />
                </div>

                <div className="profile-page-content">
                    <div className="profile-card">
                        <div className="profile-card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="profile-avatar-large">
                                <Skeleton circle width={100} height={100} />
                            </div>
                            <Skeleton width={250} height={28} style={{ marginBottom: '8px' }} />
                            <Skeleton width={180} height={16} />
                        </div>

                        <div className="profile-info-section">
                            <Skeleton width={200} height={24} style={{ marginBottom: '20px' }} />

                            <div className="profile-info-grid">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="profile-info-item">
                                        <Skeleton width={100} height={12} />
                                        <Skeleton height={40} borderRadius={6} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="profile-actions">
                            <Skeleton width={150} height={42} borderRadius={8} />
                        </div>
                    </div>
                </div>
            </div>
        </SkeletonTheme>
    );
};

export default ProfileSkeleton;
