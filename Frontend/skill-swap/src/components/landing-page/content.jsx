import React from 'react'

function Content() {
    return (
        <div className='content bg-gradient-to-br from-gray-900 via-blue-900 to-black h-screen w-3/5 flex flex-col items-center justify-center relative overflow-hidden'>
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-700 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>
            </div>
            
            <div className='relative z-10 text-center px-8'>
                <div className='mb-8'>
                    <div className='inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-2xl'>
                        <svg className='w-14 h-14 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
                        </svg>
                    </div>
                </div>
                <h1 className='text-white text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent'>
                    Skill Swap
                </h1>
                <p className='text-blue-200 text-xl mb-8 max-w-md mx-auto leading-relaxed'>
                    Connect with passionate learners worldwide. Share your expertise, learn new skills, and grow together.
                </p>
                <div className='flex items-center justify-center space-x-8 text-cyan-300 mt-12'>
                    <div className='flex flex-col items-center'>
                        <div className='w-12 h-12 bg-blue-800 bg-opacity-50 rounded-full flex items-center justify-center mb-2'>
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                            </svg>
                        </div>
                        <span className='text-sm'>Connect</span>
                    </div>
                    <div className='flex flex-col items-center'>
                        <div className='w-12 h-12 bg-blue-800 bg-opacity-50 rounded-full flex items-center justify-center mb-2'>
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' />
                            </svg>
                        </div>
                        <span className='text-sm'>Exchange</span>
                    </div>
                    <div className='flex flex-col items-center'>
                        <div className='w-12 h-12 bg-blue-800 bg-opacity-50 rounded-full flex items-center justify-center mb-2'>
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                            </svg>
                        </div>
                        <span className='text-sm'>Grow</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Content