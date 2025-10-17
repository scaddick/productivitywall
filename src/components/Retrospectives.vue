<template>
  <div class="retro-container">
    <header class="retro-header">
      <button @click="$emit('back')" class="btn btn-back">← Back to Dashboard</button>
      <h1>🔄 Team Retrospectives</h1>
      <div class="retro-host-info" v-if="selectedRetroHost">
        <span>Host: <strong>{{ selectedRetroHost }}</strong></span>
      </div>
    </header>

    <div class="retro-content">
      <!-- Timer Section -->
      <div class="timer-section">
        <div class="timer-controls">
          <input 
            v-model.number="timerMinutes" 
            type="number" 
            min="1" 
            max="60" 
            placeholder="Minutes"
            class="timer-input"
          >
          <button @click="startTimer" class="btn btn-timer" :disabled="timerRunning">
            {{ timerRunning ? 'Running...' : 'Start Timer' }}
          </button>
          <button @click="stopTimer" class="btn btn-danger" v-if="timerRunning">
            Stop
          </button>
        </div>
        <div v-if="timerRunning || timeRemaining > 0" class="timer-display">
          <div class="timer-circle" :class="{ 'timer-warning': timeRemaining <= 60, 'timer-critical': timeRemaining <= 30 }">
            <span class="timer-time">{{ formatTime(timeRemaining) }}</span>
          </div>
        </div>
      </div>

      <!-- Team Mantra -->
      <div class="mantra-section">
        <h3>✨ Team Mantra</h3>
        <textarea 
          v-model="teamMantra" 
          placeholder="Enter your team's mantra for this iteration..."
          class="mantra-input"
        ></textarea>
      </div>

      <!-- Voting Section -->
      <div class="voting-section">
        <h3>📊 Weekly Ratings</h3>
        <p class="voting-description">Rate the previous week (1-5 scale). Votes are anonymous.</p>
        
        <div class="voting-grid">
          <div class="vote-category">
            <h4>🛡️ Safety</h4>
            <p>How safe did you feel to speak up and share ideas?</p>
            <div class="rating-buttons">
              <button 
                v-for="rating in 5" 
                :key="rating"
                @click="submitVote('safety', rating)"
                class="rating-btn"
                :class="{ 'voted': userVotes.safety === rating }"
              >
                {{ rating }}
              </button>
            </div>
            <div class="average-display" v-if="averages.safety">
              Average: {{ averages.safety.toFixed(1) }} ({{ voteCounts.safety }} votes)
            </div>
          </div>

          <div class="vote-category">
            <h4>😊 Happiness</h4>
            <p>How happy were you with the team dynamics?</p>
            <div class="rating-buttons">
              <button 
                v-for="rating in 5" 
                :key="rating"
                @click="submitVote('happiness', rating)"
                class="rating-btn"
                :class="{ 'voted': userVotes.happiness === rating }"
              >
                {{ rating }}
              </button>
            </div>
            <div class="average-display" v-if="averages.happiness">
              Average: {{ averages.happiness.toFixed(1) }} ({{ voteCounts.happiness }} votes)
            </div>
          </div>

          <div class="vote-category">
            <h4>⭐ Satisfaction</h4>
            <p>How satisfied were you with the work accomplished?</p>
            <div class="rating-buttons">
              <button 
                v-for="rating in 5" 
                :key="rating"
                @click="submitVote('satisfaction', rating)"
                class="rating-btn"
                :class="{ 'voted': userVotes.satisfaction === rating }"
              >
                {{ rating }}
              </button>
            </div>
            <div class="average-display" v-if="averages.satisfaction">
              Average: {{ averages.satisfaction.toFixed(1) }} ({{ voteCounts.satisfaction }} votes)
            </div>
          </div>
        </div>
      </div>

      <!-- Retro Board Section -->
      <div class="retro-board-section">
        <h3>📋 Retrospective Board</h3>
        
        <!-- Image Upload -->
        <div class="image-upload-section">
          <input 
            type="file" 
            @change="handleImageUpload" 
            accept="image/*" 
            ref="imageInput"
            class="image-input"
          >
          <button @click="$refs.imageInput.click()" class="btn btn-upload">
            📁 Upload Background Image
          </button>
          <button @click="useTemplateImage" class="btn btn-template">
            🎨 Use Template
          </button>
        </div>

        <!-- Retro Board -->
        <div class="retro-board" @click="addTicketAtPosition" ref="retroBoard">
          <img 
            v-if="backgroundImage" 
            :src="backgroundImage" 
            alt="Retro board background"
            class="board-background"
          >
          
          <!-- Tickets -->
          <div 
            v-for="ticket in tickets" 
            :key="ticket.id"
            class="retro-ticket"
            :style="{ left: ticket.x + 'px', top: ticket.y + 'px' }"
            @mousedown="startDrag(ticket, $event)"
            @click.stop
          >
            <div class="ticket-content">
              <textarea 
                v-model="ticket.content"
                placeholder="Add your note..."
                class="ticket-textarea"
                @click.stop
              ></textarea>
              <button @click="removeTicket(ticket.id)" class="ticket-remove">×</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Section -->
      <div class="actions-section">
        <h3>🎯 Action Items</h3>
        <div class="action-input">
          <input 
            v-model="newAction" 
            placeholder="Add an action item..."
            class="input"
            @keyup.enter="addAction"
          >
          <button @click="addAction" class="btn">Add Action</button>
        </div>
        
        <div class="actions-list">
          <div v-for="action in actions" :key="action.id" class="action-item">
            <span>{{ action.content }}</span>
            <button @click="removeAction(action.id)" class="btn btn-danger btn-xs">×</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export default {
  name: 'Retrospectives',
  props: {
    teamMembers: Array,
    selectedRetroHost: String
  },
  emits: ['back'],
  setup() {
    // Persistent data
    const teamMantra = useLocalStorage('teamMantra', '')
    const tickets = useLocalStorage('retroTickets', [])
    const actions = useLocalStorage('retroActions', [])
    const backgroundImage = useLocalStorage('retroBackgroundImage', '')
    const votes = useLocalStorage('retroVotes', {})
    const userVotes = useLocalStorage('userRetroVotes', {})
    
    // Timer state
    const timerMinutes = ref(5)
    const timeRemaining = ref(0)
    const timerRunning = ref(false)
    const timerInterval = ref(null)
    
    // Form data
    const newAction = ref('')
    
    // Drag state
    const dragState = ref({
      isDragging: false,
      ticket: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0
    })

    // Generate anonymous user ID for voting
    const userId = useLocalStorage('retroUserId', () => 'user_' + Math.random().toString(36).substr(2, 9))

    // Computed voting averages
    const averages = computed(() => {
      const result = {}
      const categories = ['safety', 'happiness', 'satisfaction']
      
      categories.forEach(category => {
        const categoryVotes = votes.value[category] || []
        if (categoryVotes.length > 0) {
          const sum = categoryVotes.reduce((acc, vote) => acc + vote, 0)
          result[category] = sum / categoryVotes.length
        }
      })
      
      return result
    })

    const voteCounts = computed(() => {
      const result = {}
      const categories = ['safety', 'happiness', 'satisfaction']
      
      categories.forEach(category => {
        result[category] = (votes.value[category] || []).length
      })
      
      return result
    })

    // Timer functions
    const startTimer = () => {
      if (timerMinutes.value > 0) {
        timeRemaining.value = timerMinutes.value * 60
        timerRunning.value = true
        
        timerInterval.value = setInterval(() => {
          timeRemaining.value--
          
          if (timeRemaining.value <= 0) {
            stopTimer()
            // Play notification sound or show alert
            alert('⏰ Time\'s up!')
          }
        }, 1000)
      }
    }

    const stopTimer = () => {
      timerRunning.value = false
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }
      timeRemaining.value = 0
    }

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Voting functions
    const submitVote = (category, rating) => {
      // Initialize votes structure if needed
      if (!votes.value[category]) {
        votes.value[category] = []
      }
      
      // Remove previous vote from this user for this category
      const existingVoteIndex = votes.value[category].findIndex(vote => vote.userId === userId.value)
      if (existingVoteIndex !== -1) {
        votes.value[category].splice(existingVoteIndex, 1)
      }
      
      // Add new vote
      votes.value[category].push({
        userId: userId.value,
        rating: rating,
        timestamp: new Date()
      })
      
      // Update user votes for UI
      userVotes.value[category] = rating
      
      // Force reactivity update
      votes.value = { ...votes.value }
    }

    // Image functions
    const handleImageUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          backgroundImage.value = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    const useTemplateImage = () => {
      backgroundImage.value = '/retro-template.svg'
    }

    // Ticket functions
    const addTicketAtPosition = (event) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left - 50 // Center the ticket
      const y = event.clientY - rect.top - 25
      
      tickets.value.push({
        id: Date.now(),
        content: '',
        x: Math.max(0, x),
        y: Math.max(0, y)
      })
    }

    const removeTicket = (id) => {
      tickets.value = tickets.value.filter(ticket => ticket.id !== id)
    }

    // Drag functions
    const startDrag = (ticket, event) => {
      dragState.value = {
        isDragging: true,
        ticket: ticket,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - ticket.x,
        offsetY: event.clientY - ticket.y
      }
      
      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', stopDrag)
    }

    const handleDrag = (event) => {
      if (dragState.value.isDragging && dragState.value.ticket) {
        dragState.value.ticket.x = event.clientX - dragState.value.offsetX
        dragState.value.ticket.y = event.clientY - dragState.value.offsetY
      }
    }

    const stopDrag = () => {
      dragState.value.isDragging = false
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    // Action functions
    const addAction = () => {
      if (newAction.value.trim()) {
        actions.value.push({
          id: Date.now(),
          content: newAction.value.trim(),
          timestamp: new Date()
        })
        newAction.value = ''
      }
    }

    const removeAction = (id) => {
      actions.value = actions.value.filter(action => action.id !== id)
    }

    // Cleanup on unmount
    onUnmounted(() => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
      }
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', stopDrag)
    })

    // Initialize template image if no background is set
    onMounted(() => {
      if (!backgroundImage.value) {
        useTemplateImage()
      }
    })

    return {
      // Data
      teamMantra,
      tickets,
      actions,
      backgroundImage,
      votes,
      userVotes,
      timerMinutes,
      timeRemaining,
      timerRunning,
      newAction,
      userId,
      
      // Computed
      averages,
      voteCounts,
      
      // Methods
      startTimer,
      stopTimer,
      formatTime,
      submitVote,
      handleImageUpload,
      useTemplateImage,
      addTicketAtPosition,
      removeTicket,
      startDrag,
      addAction,
      removeAction
    }
  }
}
</script>