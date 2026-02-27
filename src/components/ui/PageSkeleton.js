import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const PageSkeleton = () => {
    return (
        <SkeletonTheme baseColor="#f3f4f6" highlightColor="#ffffff">
            <div className="page-card">
                {/* Header Title */}
                <div style={{ marginBottom: '24px' }}>
                    <Skeleton width={200} height={32} />
                </div>

                {/* Filters Row */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <Skeleton width={150} height={38} />
                    <Skeleton width={150} height={38} />
                    <Skeleton width={200} height={38} />
                    <div style={{ marginLeft: 'auto' }}>
                        <Skeleton width={120} height={38} />
                    </div>
                </div>

                {/* Table Header */}
                <div style={{ marginBottom: '12px' }}>
                    <Skeleton height={40} borderRadius={8} />
                </div>

                {/* Table Body Rows */}
                {[...Array(8)].map((_, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                        <Skeleton height={35} borderRadius={4} />
                    </div>
                ))}

                {/* Footer / Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <Skeleton width={150} height={20} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Skeleton width={30} height={30} />
                        <Skeleton width={30} height={30} />
                        <Skeleton width={30} height={30} />
                    </div>
                </div>
            </div>
        </SkeletonTheme>
    );
};

export default PageSkeleton;
