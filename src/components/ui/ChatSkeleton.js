import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ChatSkeleton = () => {
    return (
        <SkeletonTheme baseColor="#f3f4f6" highlightColor="#ffffff">
            <div className="container-fluid p-0 chat-page-wrapper">
                <div className="row g-0 h-100">
                    {/* Sidebar Skeleton */}
                    <div className="col-md-3 border-end bg-light chat-sidebar-column">
                        <div className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center flex-shrink-0">
                            <Skeleton width={100} height={24} />
                            <Skeleton width={32} height={24} />
                        </div>
                        <div className="list-group list-group-flush p-2">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="d-flex align-items-center p-3 mb-2 rounded-3 bg-white shadow-sm">
                                    <Skeleton circle width={48} height={48} />
                                    <div className="flex-grow-1 ms-3">
                                        <Skeleton width="60%" height={18} />
                                        <Skeleton width="40%" height={12} className="mt-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Chat Area Skeleton */}
                    <div className="col-md-9 d-flex flex-column chat-main-column bg-white">
                        <div className="p-3 border-bottom d-flex align-items-center bg-white flex-shrink-0">
                            <Skeleton circle width={40} height={40} />
                            <div className="ms-3">
                                <Skeleton width={120} height={18} />
                                <Skeleton width={80} height={12} className="mt-1" />
                            </div>
                        </div>
                        <div className="flex-grow-1 p-4 bg-light overflow-hidden">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`d-flex mb-4 ${i % 2 === 0 ? 'justify-content-start' : 'justify-content-end'}`}>
                                    <div className="d-flex" style={{ width: '40%' }}>
                                        {i % 2 === 0 && <Skeleton circle width={32} height={32} className="me-2 mt-auto" />}
                                        <div className="flex-grow-1">
                                            <Skeleton height={60} borderRadius={15} />
                                        </div>
                                        {i % 2 !== 0 && <Skeleton circle width={32} height={32} className="ms-2 mt-auto" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-top bg-white">
                            <div className="d-flex align-items-center gap-2">
                                <Skeleton circle width={36} height={36} />
                                <div className="flex-grow-1">
                                    <Skeleton height={45} borderRadius={25} />
                                </div>
                                <Skeleton circle width={36} height={36} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SkeletonTheme>
    );
};

export default ChatSkeleton;
