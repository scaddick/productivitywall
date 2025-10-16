<template>
  <div v-if="currentView === 'dashboard'" class="container">
    <header class="header">
      <h1>🚀 Team Standup Wall</h1>
      <p>Your daily hub for team coordination and updates</p>
      <button @click="currentView = 'team-management'" class="btn btn-team-management">
        👥 Manage Team
      </button>
    </header>

    <div class="dashboard-grid">
      <!-- Standup Notes -->
      <div class="card notes-card">
        <h2>📝 Daily Standup Notes</h2>
        <div class="mb-2">
          <select v-model="newNote.category" class="select">
            <option value="updates">Updates from Meeting</option>
            <option value="misc">Miscellaneous Updates</option>
            <option value="discussion">Topics for Discussion</option>
            <option value="kudos">Team Kudos</option>
          </select>
        </div>
        <textarea 
          v-model="newNote.content" 
          placeholder="Add your note..." 
          class="textarea"
        ></textarea>
        <button @click="addNote" class="btn">Add Note</button>
        
        <div style="margin-top: 20px;">
          <div v-for="note in standupNotes" :key="note.id" class="note-item">
            <strong>{{ getCategoryLabel(note.category) }}</strong>
            <p>{{ note.content }}</p>
            <div class="note-meta">
              {{ note.author }} • {{ formatDate(note.timestamp) }}
              <button @click="removeNote(note.id)" class="btn btn-danger" style="float: right; padding: 2px 6px;">×</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Useful Links - Larger Column -->
      <div class="card links-card">
        <h2>🔗 Useful Links</h2>
        <div class="mb-2">
          <input 
            v-model="newLink.title" 
            placeholder="Link title..." 
            class="input"
          >
          <input 
            v-model="newLink.description" 
            placeholder="Description (optional)..." 
            class="input"
          >
          <input 
            v-model="newLink.url" 
            placeholder="URL..." 
            class="input"
          >
          <button @click="addLink" class="btn">Add Link</button>
        </div>
        
        <div style="margin-top: 20px;">
          <div v-for="link in usefulLinks" :key="link.id" class="link-item clickable-link" @click="openLink(link.url)">
            <div class="link-content">
              <div class="link-title">
                {{ link.title }}
              </div>
              <p v-if="link.description" class="link-description">{{ link.description }}</p>
              <small class="link-url">{{ link.url }}</small>
            </div>
            <button @click.stop="removeLink(link.id)" class="btn btn-danger link-remove">×</button>
          </div>
        </div>
      </div>

      <!-- Meeting Host Spinner - Smaller -->
      <div class="card spinner-card">
        <h2>🎲 Host</h2>
        <div class="spinner-section-compact">
          <button @click="spinForHost" class="btn btn-sm" :disabled="teamMembers.length === 0">
            {{ spinning ? 'Spinning...' : 'Spin' }}
          </button>
          <div v-if="selectedHost" class="spinner-result-compact">
            <strong>{{ selectedHost }}</strong>
            <button @click="clearHost" class="btn btn-danger btn-xs">×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Support Rota -->
    <div class="support-rota">
      <h2>🛠️ Support Rota</h2>
      <p class="text-sm text-gray mb-2">Two-week staggered rotation (Engineers only)</p>
      
      <div class="flex mb-2">
        <select v-model="newSupportMember" class="select" style="margin-right: 10px;">
          <option value="">Select engineer for support...</option>
          <option v-for="member in availableEngineersForSupport" :key="member.id" :value="member.name">
            {{ member.name }}
          </option>
        </select>
        <button @click="addToSupport" class="btn" :disabled="!newSupportMember">
          {{ supportRota.length >= 2 ? 'Add New Week 1 (Rotate)' : 'Add to Support' }}
        </button>
      </div>

      <div v-for="(member, index) in supportRota" :key="member.id" class="support-member">
        <div>
          <strong>{{ member.name }}</strong>
          <span class="text-sm text-gray"> - Week {{ index + 1 }} of 2</span>
        </div>
        <button @click="removeFromSupport(member.id)" class="btn btn-danger">Remove</button>
      </div>

      <div v-if="supportRota.length === 0" class="empty-support">
        <p class="text-sm text-gray">No engineers currently on support rotation</p>
      </div>
    </div>

    <!-- Team Calendar -->
    <div class="calendar">
      <div class="calendar-header">
        <button @click="previousMonth" class="btn calendar-nav">‹</button>
        <h2>📅 {{ currentMonthYear }}</h2>
        <button @click="nextMonth" class="btn calendar-nav">›</button>
      </div>

      <!-- Holiday Controls -->
      <div class="holiday-controls">
        <div class="holiday-controls-main">
          <span class="text-sm text-gray">Show public holidays:</span>
          <label class="holiday-toggle">
            <input type="checkbox" v-model="holidaySettings.showUK">
            <span>🇬🇧 UK</span>
          </label>
          <label class="holiday-toggle">
            <input type="checkbox" v-model="holidaySettings.showPoland">
            <span>🇵🇱 Poland</span>
          </label>
          <label class="holiday-toggle">
            <input type="checkbox" v-model="holidaySettings.showMacedonia">
            <span>🇲🇰 N. Macedonia</span>
          </label>
        </div>
        <div class="holiday-status">
          <span v-if="holidaysLoading" class="text-xs text-gray">🔄 Loading holidays...</span>
          <span v-else-if="holidaysError" class="text-xs text-red">⚠️ {{ holidaysError }}</span>
          <span v-else class="text-xs text-green">✅ Holidays loaded</span>
        </div>
      </div>
      
      <div class="flex mb-2 flex-wrap">
        <input 
          v-model="newEvent.title" 
          placeholder="Event title..." 
          class="input" 
          style="margin-right: 10px; flex: 1; min-width: 150px;"
        >
        <select v-model="newEvent.type" class="select" style="margin-right: 10px; width: 120px;">
          <option value="full">Full Day</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
        </select>
        <select v-model="newEvent.color" class="select" style="margin-right: 10px; width: 120px;">
          <option value="teal">Teal</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="purple">Purple</option>
          <option value="red">Red</option>
          <option value="orange">Orange</option>
        </select>
        <input 
          v-model="newEvent.startDate" 
          type="date" 
          class="input" 
          style="margin-right: 10px; width: 140px;"
          placeholder="Start date"
        >
        <input 
          v-model="newEvent.endDate" 
          type="date" 
          class="input" 
          style="margin-right: 10px; width: 140px;"
          placeholder="End date (optional)"
        >
      </div>
      
      <div class="flex mb-2 flex-wrap">
        <div class="assignees-section" style="flex: 1; margin-right: 10px;">
          <label class="text-sm text-gray">Assign team members:</label>
          <div class="assignees-list">
            <label v-for="member in teamMembers" :key="member.id" class="assignee-checkbox">
              <input 
                type="checkbox" 
                :value="member.name" 
                v-model="newEvent.assignees"
              >
              <span>{{ member.name }}</span>
            </label>
          </div>
        </div>
        <button @click="addEvent" class="btn" style="align-self: flex-end;">Add Event</button>
      </div>
      
      <div class="calendar-container">
        <!-- Day headers -->
        <div class="calendar-day-headers">
          <div v-for="dayName in dayNames" :key="dayName" class="calendar-day-header">
            {{ dayName }}
          </div>
        </div>
        
        <!-- Calendar grid -->
        <div class="calendar-grid">
          <div v-for="day in calendarDays" :key="day.date" 
               :class="['calendar-day', { 
                 'other-month': day.otherMonth, 
                 'has-event': day.hasEvent,
                 'has-holiday': day.hasHoliday,
                 'weekend': day.isWeekend,
                 'today': day.isToday
               }]">
            <div class="calendar-day-number">{{ day.day }}</div>
            
            <!-- Public Holidays -->
            <div v-for="holiday in day.holidays" :key="`${holiday.country}-${holiday.date}`" 
                 class="holiday-item">
              <div class="holiday-content">
                <span class="holiday-flag">{{ holiday.flag }}</span>
                <span class="holiday-name">{{ holiday.name }}</span>
              </div>
            </div>
            
            <!-- Regular Events -->
            <div v-for="event in day.events" :key="event.id" 
                 class="text-sm event-item" 
                 :class="getEventClass(event)"
                 :style="getEventStyle(event)">
              <div class="event-content">
                <span class="event-title">{{ event.title }}</span>
                <span v-if="event.type !== 'full'" class="event-type">{{ getEventTypeLabel(event.type) }}</span>
                <div v-if="event.assignees && event.assignees.length > 0" class="event-assignees">
                  {{ event.assignees.join(', ') }}
                </div>
              </div>
              <button @click="removeEvent(event.id)" class="event-remove">×</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Team Management Page -->
  <TeamManagement 
    v-else-if="currentView === 'team-management'"
    :team-members="teamMembers"
    @back="currentView = 'dashboard'"
    @add-member="addMember"
    @remove-member="removeMember"
    @edit-member="editMember"
  />
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import TeamManagement from './components/TeamManagement.vue'

export default {
  name: 'App',
  components: {
    TeamManagement
  },
  setup() {
    // Reactive data with localStorage persistence
    const teamMembers = useLocalStorage('teamMembers', [])
    const standupNotes = useLocalStorage('standupNotes', [])
    const usefulLinks = useLocalStorage('usefulLinks', [])
    const calendarEvents = useLocalStorage('calendarEvents', [])
    const supportRota = useLocalStorage('supportRota', [])
    
    // View management
    const currentView = ref('dashboard')
    
    // Form data
    const newNote = ref({ category: 'updates', content: '' })
    const newLink = ref({ title: '', description: '', url: '' })
    const newEvent = ref({ title: '', type: 'full', color: 'teal', startDate: '', endDate: '', assignees: [] })
    const newSupportMember = ref('')
    
    // Spinner state with localStorage persistence
    const spinning = ref(false)
    const selectedHost = useLocalStorage('selectedHost', '')
    
    // Current date for calendar
    const currentDate = ref(new Date())
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Dynamic holidays data - fetched from APIs
    const holidaysCache = ref({})
    const holidaysLoading = ref(false)
    const holidaysError = ref(null)

    // Holiday settings
    const holidaySettings = useLocalStorage('holidaySettings', {
      showUK: true,
      showPoland: true,
      showMacedonia: true
    })

    // Team management
    const addMember = (memberData) => {
      teamMembers.value.push({
        id: Date.now(),
        name: memberData.name,
        role: memberData.role
      })
    }

    const removeMember = (id) => {
      teamMembers.value = teamMembers.value.filter(member => member.id !== id)
      // Remove from support rota if they were on it
      supportRota.value = supportRota.value.filter(member => member.id !== id)
    }

    const editMember = (memberData) => {
      const memberIndex = teamMembers.value.findIndex(member => member.id === memberData.id)
      if (memberIndex !== -1) {
        const oldMember = teamMembers.value[memberIndex]
        teamMembers.value[memberIndex] = {
          ...oldMember,
          name: memberData.name,
          role: memberData.role
        }
        
        // Update support rota if the member was on it and role changed
        const supportIndex = supportRota.value.findIndex(member => member.id === memberData.id)
        if (supportIndex !== -1) {
          if (memberData.role !== 'Eng') {
            // Remove from support if no longer an engineer
            supportRota.value = supportRota.value.filter(member => member.id !== memberData.id)
            // Reorder remaining members and update week numbers
            supportRota.value.forEach((member, index) => {
              member.week = index + 1
            })
          } else {
            // Update name in support rota
            supportRota.value[supportIndex].name = memberData.name
          }
        }
      }
    }

    // Notes management
    const addNote = () => {
      if (newNote.value.content.trim()) {
        standupNotes.value.unshift({
          id: Date.now(),
          category: newNote.value.category,
          content: newNote.value.content.trim(),
          author: 'Team Member', // Could be enhanced with user auth
          timestamp: new Date()
        })
        newNote.value.content = ''
      }
    }

    const removeNote = (id) => {
      standupNotes.value = standupNotes.value.filter(note => note.id !== id)
    }

    const getCategoryLabel = (category) => {
      const labels = {
        updates: '📋 Updates from Meeting',
        misc: '💡 Miscellaneous Updates', 
        discussion: '💬 Topics for Discussion',
        kudos: '👏 Team Kudos'
      }
      return labels[category] || category
    }

    // Links management
    const addLink = () => {
      if (newLink.value.title.trim() && newLink.value.url.trim()) {
        usefulLinks.value.push({
          id: Date.now(),
          title: newLink.value.title.trim(),
          description: newLink.value.description.trim(),
          url: newLink.value.url.trim()
        })
        newLink.value = { title: '', description: '', url: '' }
      }
    }

    const removeLink = (id) => {
      usefulLinks.value = usefulLinks.value.filter(link => link.id !== id)
    }

    const openLink = (url) => {
      // Ensure URL has protocol
      const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
      window.open(fullUrl, '_blank', 'noopener,noreferrer')
    }

    // Spinner functionality
    const spinForHost = () => {
      if (teamMembers.value.length === 0) return
      
      spinning.value = true
      let counter = 0
      const maxSpins = 20
      
      const spinInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * teamMembers.value.length)
        selectedHost.value = teamMembers.value[randomIndex].name
        counter++
        
        if (counter >= maxSpins) {
          clearInterval(spinInterval)
          spinning.value = false
        }
      }, 100)
    }

    const clearHost = () => {
      selectedHost.value = ''
    }

    // Support rota management - Engineers only
    const availableEngineersForSupport = computed(() => {
      const onSupport = supportRota.value.map(member => member.name)
      return teamMembers.value.filter(member => 
        member.role === 'Eng' && !onSupport.includes(member.name)
      )
    })

    const addToSupport = () => {
      if (newSupportMember.value) {
        const member = teamMembers.value.find(m => m.name === newSupportMember.value)
        if (member && member.role === 'Eng') {
          // Implement proper staggered rotation:
          // New member enters as Week 1
          // Existing Week 1 moves to Week 2  
          // Existing Week 2 is removed (completed 2 weeks)
          
          if (supportRota.value.length === 0) {
            // First person - becomes Week 1
            supportRota.value.push({
              id: member.id,
              name: member.name,
              startDate: new Date(),
              week: 1
            })
          } else if (supportRota.value.length === 1) {
            // Second person - existing becomes Week 2, new becomes Week 1
            supportRota.value[0].week = 2
            supportRota.value.unshift({
              id: member.id,
              name: member.name,
              startDate: new Date(),
              week: 1
            })
          } else {
            // Full rotation - remove Week 2, move Week 1 to Week 2, add new Week 1
            supportRota.value = [
              {
                id: member.id,
                name: member.name,
                startDate: new Date(),
                week: 1
              },
              {
                ...supportRota.value[0],
                week: 2
              }
            ]
          }
          
          newSupportMember.value = ''
        }
      }
    }

    const removeFromSupport = (id) => {
      supportRota.value = supportRota.value.filter(member => member.id !== id)
      // Reorder remaining members and update week numbers
      supportRota.value.forEach((member, index) => {
        member.week = index + 1
      })
    }

    // Calendar functionality
    const addEvent = () => {
      if (newEvent.value.title.trim() && newEvent.value.startDate) {
        const endDate = newEvent.value.endDate || newEvent.value.startDate
        
        // Use the date strings directly - no Date object conversion to avoid timezone issues
        const startDateStr = newEvent.value.startDate // Already in YYYY-MM-DD format
        const endDateStr = endDate // Already in YYYY-MM-DD format
        
        // Parse for comparison only
        const startDateParts = startDateStr.split('-')
        const endDateParts = endDateStr.split('-')
        
        const startYear = parseInt(startDateParts[0])
        const startMonth = parseInt(startDateParts[1])
        const startDay = parseInt(startDateParts[2])
        
        const endYear = parseInt(endDateParts[0])
        const endMonth = parseInt(endDateParts[1])
        const endDay = parseInt(endDateParts[2])
        
        // Generate events for each day in the range
        const events = []
        const originalId = Date.now()
        
        let currentYear = startYear
        let currentMonth = startMonth
        let currentDay = startDay
        
        while (true) {
          // Format current date as YYYY-MM-DD
          const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`
          
          events.push({
            id: Date.now() + Math.random(), // Ensure unique IDs for multi-day events
            title: newEvent.value.title.trim(),
            type: newEvent.value.type,
            color: newEvent.value.color,
            assignees: [...newEvent.value.assignees],
            date: dateStr,
            isMultiDay: startDateStr !== endDateStr,
            originalId: originalId // Link multi-day events together
          })
          
          // Check if we've reached the end date
          if (currentYear === endYear && currentMonth === endMonth && currentDay === endDay) {
            break
          }
          
          // Move to next day
          currentDay++
          
          // Handle month/year rollover
          const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
          if (currentDay > daysInMonth) {
            currentDay = 1
            currentMonth++
            if (currentMonth > 12) {
              currentMonth = 1
              currentYear++
            }
          }
        }
        
        calendarEvents.value.push(...events)
        newEvent.value = { title: '', type: 'full', color: 'teal', startDate: '', endDate: '', assignees: [] }
      }
    }

    // Calendar navigation
    const previousMonth = async () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
      await fetchHolidaysForYear(currentDate.value.getFullYear())
    }

    const nextMonth = async () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
      await fetchHolidaysForYear(currentDate.value.getFullYear())
    }

    const currentMonthYear = computed(() => {
      return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    })

    const removeEvent = (id) => {
      const eventToRemove = calendarEvents.value.find(event => event.id === id)
      if (eventToRemove && eventToRemove.isMultiDay) {
        // Remove all events with the same originalId (multi-day event)
        calendarEvents.value = calendarEvents.value.filter(event => event.originalId !== eventToRemove.originalId)
      } else {
        // Remove single event
        calendarEvents.value = calendarEvents.value.filter(event => event.id !== id)
      }
    }

    const getEventClass = (event) => {
      return {
        'event-full': event.type === 'full',
        'event-morning': event.type === 'morning',
        'event-afternoon': event.type === 'afternoon',
        'event-multi-day': event.isMultiDay,
        [`event-${event.color || 'teal'}`]: true
      }
    }

    const getEventStyle = (event) => {
      const colors = {
        teal: { bg: '#e6fffa', border: '#38b2ac' },
        blue: { bg: '#ebf8ff', border: '#3182ce' },
        green: { bg: '#f0fff4', border: '#38a169' },
        purple: { bg: '#faf5ff', border: '#805ad5' },
        red: { bg: '#fed7d7', border: '#e53e3e' },
        orange: { bg: '#ffecd1', border: '#dd6b20' }
      }
      
      const colorScheme = colors[event.color] || colors.teal
      return {
        backgroundColor: colorScheme.bg,
        borderLeftColor: colorScheme.border
      }
    }

    const getEventTypeLabel = (type) => {
      const labels = {
        morning: '🌅 AM',
        afternoon: '🌇 PM'
      }
      return labels[type] || ''
    }

    // Calendar grid computation - timezone safe
    const calendarDays = computed(() => {
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      const firstDay = new Date(year, month, 1)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())
      
      const days = []
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      
      for (let i = 0; i < 42; i++) {
        // Format date as YYYY-MM-DD without timezone conversion
        const currentYear = startDate.getFullYear()
        const currentMonth = startDate.getMonth() + 1
        const currentDay = startDate.getDate()
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`
        
        const dayEvents = calendarEvents.value.filter(event => event.date === dateStr)
        const dayHolidays = getHolidaysForDate(dateStr)
        const dayOfWeek = startDate.getDay()
        
        days.push({
          date: dateStr,
          day: currentDay,
          otherMonth: startDate.getMonth() !== month,
          hasEvent: dayEvents.length > 0,
          hasHoliday: dayHolidays.length > 0,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isToday: dateStr === todayStr,
          events: dayEvents,
          holidays: dayHolidays
        })
        
        startDate.setDate(startDate.getDate() + 1)
      }
      
      return days
    })

    // API functions for fetching holidays
    const fetchUKHolidays = async (year) => {
      try {
        const response = await fetch(`https://www.gov.uk/bank-holidays.json`)
        const data = await response.json()
        
        // Extract England and Wales holidays for the specified year
        const englandHolidays = data['england-and-wales'].events
          .filter(event => event.date.startsWith(year.toString()))
          .map(event => ({
            date: event.date,
            name: event.title,
            country: 'UK',
            flag: '🇬🇧'
          }))
        
        return englandHolidays
      } catch (error) {
        console.error('Error fetching UK holidays:', error)
        return []
      }
    }

    const fetchPolandHolidays = async (year) => {
      try {
        // Using Nager.Date API for Poland
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PL`)
        const data = await response.json()
        
        return data.map(holiday => ({
          date: holiday.date,
          name: holiday.name,
          country: 'Poland',
          flag: '🇵🇱'
        }))
      } catch (error) {
        console.error('Error fetching Poland holidays:', error)
        return []
      }
    }

    const fetchMacedoniaHolidays = async (year) => {
      try {
        // Using Nager.Date API for North Macedonia
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/MK`)
        const data = await response.json()
        
        return data.map(holiday => ({
          date: holiday.date,
          name: holiday.name,
          country: 'North Macedonia',
          flag: '🇲🇰'
        }))
      } catch (error) {
        console.error('Error fetching Macedonia holidays:', error)
        return []
      }
    }

    const fetchHolidaysForYear = async (year) => {
      const cacheKey = year.toString()
      
      // Return cached data if available
      if (holidaysCache.value[cacheKey]) {
        return holidaysCache.value[cacheKey]
      }

      holidaysLoading.value = true
      holidaysError.value = null

      try {
        const [ukHolidays, polandHolidays, macedoniaHolidays] = await Promise.all([
          fetchUKHolidays(year),
          fetchPolandHolidays(year),
          fetchMacedoniaHolidays(year)
        ])

        const allHolidays = {
          uk: ukHolidays,
          poland: polandHolidays,
          macedonia: macedoniaHolidays
        }

        // Cache the results
        holidaysCache.value[cacheKey] = allHolidays
        
        return allHolidays
      } catch (error) {
        console.error('Error fetching holidays:', error)
        holidaysError.value = 'Failed to fetch holiday data'
        return { uk: [], poland: [], macedonia: [] }
      } finally {
        holidaysLoading.value = false
      }
    }

    // Holiday functions
    const getHolidaysForDate = (dateStr) => {
      const holidays = []
      const year = dateStr.split('-')[0]
      const yearHolidays = holidaysCache.value[year]
      
      if (!yearHolidays) return holidays
      
      if (holidaySettings.value.showUK) {
        const ukHoliday = yearHolidays.uk.find(h => h.date === dateStr)
        if (ukHoliday) holidays.push(ukHoliday)
      }
      
      if (holidaySettings.value.showPoland) {
        const polandHoliday = yearHolidays.poland.find(h => h.date === dateStr)
        if (polandHoliday) holidays.push(polandHoliday)
      }
      
      if (holidaySettings.value.showMacedonia) {
        const macedoniaHoliday = yearHolidays.macedonia.find(h => h.date === dateStr)
        if (macedoniaHoliday) holidays.push(macedoniaHoliday)
      }
      
      return holidays
    }

    const toggleHolidayCountry = (country) => {
      holidaySettings.value[`show${country}`] = !holidaySettings.value[`show${country}`]
    }

    // Load holidays for current year on component mount
    onMounted(async () => {
      const currentYear = new Date().getFullYear()
      await fetchHolidaysForYear(currentYear)
    })

    // Utility functions
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }

    return {
      // Data
      currentView,
      teamMembers,
      standupNotes,
      usefulLinks,
      calendarEvents,
      supportRota,
      newNote,
      newLink,
      newEvent,
      newSupportMember,
      spinning,
      selectedHost,
      dayNames,
      holidaysCache,
      holidaysLoading,
      holidaysError,
      holidaySettings,
      
      // Computed
      availableEngineersForSupport,
      calendarDays,
      currentMonthYear,
      
      // Methods
      addMember,
      removeMember,
      editMember,
      addNote,
      removeNote,
      getCategoryLabel,
      addLink,
      removeLink,
      openLink,
      spinForHost,
      clearHost,
      addToSupport,
      removeFromSupport,
      addEvent,
      removeEvent,
      previousMonth,
      nextMonth,
      getEventClass,
      getEventStyle,
      getEventTypeLabel,
      fetchHolidaysForYear,
      getHolidaysForDate,
      toggleHolidayCountry,
      formatDate
    }
  }
}
</script>