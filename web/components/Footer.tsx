import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="border-t border-gray-800 py-8 bg-gray-900/50 backdrop-blur-md">
            <div className="max-w-5xl mx-auto px-4 text-center text-gray-600 text-sm">
                <p className="mb-2">&copy; 2026 Military Job Aggregator. All rights reserved.</p>
                <p className="text-gray-700 text-xs">
                    본 서비스는 병무청 공식 서비스가 아니며, 구직 편의를 위해 제공되는 정보입니다.<br />
                    채용 공고의 상세 내용은 각 채용 플랫폼에서 확인하시기 바랍니다.
                </p>
                <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500">
                    <span>Data sourced from MMA, Saramin, JobKorea, and Wanted.</span>
                </div>
            </div>
        </footer>
    );
};
