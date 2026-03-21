import { useState, useEffect } from 'react'

function Navigation() {
  const [activeSection, setActiveSection] = useState('calculate')
  const [hasResults, setHasResults] = useState(false)

  // Check if results exist (monitors DOM)
  useEffect(() => {
    const checkResults = () => {
      const resultsElement = document.querySelector('.results')
      setHasResults(!!resultsElement)
    }

    // Check initially
    checkResults()

    // Check periodically (when user calculates)
    const interval = setInterval(checkResults, 1000)
    return () => clearInterval(interval)
  }, [])

  // Smooth scroll to section
  const scrollToSection = (section) => {
    setActiveSection(section)

    let targetElement
    switch (section) {
      case 'calculate':
        targetElement = document.querySelector('.calculator')
        break
      case 'results':
        targetElement = document.querySelector('.results')
        break
      case 'timeline':
        targetElement = document.querySelector('.timeline-calendar')
        break
      default:
        return
    }

    if (targetElement) {
      const headerOffset = 120 // Account for sticky headers
      const elementPosition = targetElement.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(10)
      }
    }
  }

  const navItems = [
    { 
      id: 'calculate', 
      label: 'Calculate', 
      icon: '⚙️',
      enabled: true 
    },
    { 
      id: 'results', 
      label: 'Results', 
      icon: '📊',
      enabled: hasResults 
    },
    { 
      id: 'timeline', 
      label: 'Timeline', 
      icon: '📅',
      enabled: hasResults 
    }
  ]

  return (
    <>
      {/* Desktop Sub-Navigation */}
      <nav className="sub-nav desktop-only">
        <div className="sub-nav-content">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''} ${!item.enabled ? 'disabled' : ''}`}
              onClick={() => item.enabled && scrollToSection(item.id)}
              disabled={!item.enabled}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav mobile-only">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`bottom-nav-item ${activeSection === item.id ? 'active' : ''} ${!item.enabled ? 'disabled' : ''}`}
            onClick={() => item.enabled && scrollToSection(item.id)}
            disabled={!item.enabled}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}

export default Navigation