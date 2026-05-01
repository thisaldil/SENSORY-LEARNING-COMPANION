/** Very small pathname → breadcrumb items for wayfinding. */
export function breadcrumbsForPath(pathname, extras = {}) {
  const map = {
    '/student/dashboard': [{ label: 'Student', href: '/student/dashboard' }, { label: 'Dashboard' }],
    '/student/courses': [
      { label: 'Student', href: '/student/dashboard' },
      { label: 'Courses' },
    ],
    '/student/reports': [
      { label: 'Student', href: '/student/dashboard' },
      { label: 'Reports' },
    ],
    '/lecturer/dashboard': [
      { label: 'Lecturer', href: '/lecturer/dashboard' },
      { label: 'Dashboard' },
    ],
    '/lecturer/courses': [
      { label: 'Lecturer', href: '/lecturer/dashboard' },
      { label: 'Courses' },
    ],
    '/lecturer/sessions': [
      { label: 'Lecturer', href: '/lecturer/dashboard' },
      { label: 'Sessions' },
    ],
    '/lecturer/analytics': [
      { label: 'Lecturer', href: '/lecturer/dashboard' },
      { label: 'Analytics' },
    ],
    '/admin/users': [{ label: 'Admin', href: '/admin/users' }, { label: 'Users' }],
    '/admin/settings': [
      { label: 'Admin', href: '/admin/users' },
      { label: 'Settings' },
    ],
    '/profile': [{ label: 'Profile' }],
    '/settings': [{ label: 'Settings' }],
    '/learn': [{ label: 'Learn flow' }],
    '/learn/concept-explore': [{ label: 'Learn flow', href: '/learn' }, { label: 'Concept explore' }],
    '/learn/player': [{ label: 'Learn flow', href: '/learn' }, { label: 'Lesson player' }],
    '/quizzes': [{ label: 'Quizzes' }],
    '/activities': [{ label: 'Activities' }],
    '/progress': [{ label: 'Progress' }],
    '/cognitive': [{ label: 'Cognitive load' }],
    '/vision': [{ label: 'Vision notes' }],
    '/dev/test-generation': [{ label: 'Dev tools' }, { label: 'Gemini test' }],
  }

  if (map[pathname]) return map[pathname]

  const learnQuiz = pathname.match(/^\/learn\/quiz\/([^/]+)$/)
  if (learnQuiz) {
    return [
      { label: 'Learn flow', href: '/learn' },
      { label: 'Lesson player', href: '/learn/player' },
      { label: 'Quiz' },
    ]
  }

  const studentCourse = pathname.match(/^\/student\/courses\/([^/]+)$/)
  if (studentCourse) {
    const id = studentCourse[1]
    return [
      { label: 'Student', href: '/student/dashboard' },
      { label: 'Courses', href: '/student/courses' },
      { label: extras.lessonTitle ?? `Lesson ${id}` },
    ]
  }

  const lecturerCourse = pathname.match(/^\/lecturer\/courses\/([^/]+)$/)
  if (lecturerCourse) {
    const id = lecturerCourse[1]
    return [
      { label: 'Lecturer', href: '/lecturer/dashboard' },
      { label: 'Courses', href: '/lecturer/courses' },
      { label: extras.lessonTitle ?? `Lesson ${id}` },
    ]
  }

  return []
}
