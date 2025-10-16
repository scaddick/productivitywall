<template>
  <div class="team-management">
    <div class="header">
      <h1>👥 Team Management</h1>
      <button @click="$emit('back')" class="btn btn-back">← Back to Dashboard</button>
    </div>

    <div class="card">
      <h2>Add Team Member</h2>
      <div class="flex flex-wrap mb-2">
        <input 
          v-model="newMemberName" 
          placeholder="Team member name..." 
          class="input" 
          style="flex: 1; margin-right: 10px; min-width: 200px;"
          @keyup.enter="addMember"
        >
        <select v-model="newMemberRole" class="select" style="margin-right: 10px; width: 120px;">
          <option value="">Select Role</option>
          <option value="ADM">ADM - Agile Delivery Manager</option>
          <option value="PO">PO - Product Owner</option>
          <option value="Eng">Eng - Engineer</option>
          <option value="TL">TL - Tech Lead</option>
          <option value="QA">QA - QA Engineer</option>
        </select>
        <button @click="addMember" class="btn" :disabled="!newMemberName.trim() || !newMemberRole">
          Add Member
        </button>
      </div>
    </div>

    <div class="card">
      <h2>Current Team Members</h2>
      <div class="team-grid">
        <div v-for="member in teamMembers" :key="member.id" 
             class="team-member-card" 
             :class="getRoleCardClass(member.role)">
          
          <!-- Normal View -->
          <div v-if="editingMember !== member.id" class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-role" :class="getRoleClass(member.role)">
              {{ getRoleLabel(member.role) }}
            </div>
          </div>
          
          <!-- Edit View -->
          <div v-else class="member-edit-form">
            <input 
              v-model="editForm.name" 
              class="input edit-input" 
              placeholder="Member name"
            >
            <select v-model="editForm.role" class="select edit-select">
              <option value="ADM">ADM - Agile Delivery Manager</option>
              <option value="PO">PO - Product Owner</option>
              <option value="Eng">Eng - Engineer</option>
              <option value="TL">TL - Tech Lead</option>
              <option value="QA">QA - QA Engineer</option>
            </select>
          </div>
          
          <!-- Action Buttons -->
          <div class="member-actions">
            <template v-if="editingMember !== member.id">
              <button @click="startEdit(member)" class="btn btn-edit">
                Edit
              </button>
              <button @click="removeMember(member.id)" class="btn btn-danger member-remove">
                Remove
              </button>
            </template>
            <template v-else>
              <button @click="saveEdit(member.id)" class="btn btn-save">
                Save
              </button>
              <button @click="cancelEdit" class="btn btn-cancel">
                Cancel
              </button>
            </template>
          </div>
        </div>
      </div>
      
      <div v-if="teamMembers.length === 0" class="empty-state">
        <p>No team members added yet. Add your first team member above!</p>
      </div>
    </div>

    <!-- Role Legend -->
    <div class="card">
      <h2>🎨 Role Colors</h2>
      <div class="role-legend">
        <div v-for="role in roleTypes" :key="role.code" class="legend-item">
          <div class="legend-color" :class="getRoleClass(role.code)"></div>
          <span class="legend-label">{{ role.label }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📊 Team Statistics</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{{ teamMembers.length }}</div>
          <div class="stat-label">Total Members</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ engineerCount }}</div>
          <div class="stat-label">Engineers</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ roleDistribution.ADM || 0 }}</div>
          <div class="stat-label">ADM</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ roleDistribution.PO || 0 }}</div>
          <div class="stat-label">Product Owners</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ roleDistribution.TL || 0 }}</div>
          <div class="stat-label">Tech Leads</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ roleDistribution.QA || 0 }}</div>
          <div class="stat-label">QA Engineers</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'TeamManagement',
  props: {
    teamMembers: {
      type: Array,
      required: true
    }
  },
  emits: ['back', 'add-member', 'remove-member', 'edit-member'],
  setup(props, { emit }) {
    const newMemberName = ref('')
    const newMemberRole = ref('')
    const editingMember = ref(null)
    const editForm = ref({ name: '', role: '' })

    const roleTypes = [
      { code: 'ADM', label: 'ADM' },
      { code: 'PO', label: 'Product Owner' },
      { code: 'Eng', label: 'Engineer' },
      { code: 'TL', label: 'Tech Lead' },
      { code: 'QA', label: 'QA Engineer' }
    ]

    const addMember = () => {
      if (newMemberName.value.trim() && newMemberRole.value) {
        emit('add-member', {
          name: newMemberName.value.trim(),
          role: newMemberRole.value
        })
        newMemberName.value = ''
        newMemberRole.value = ''
      }
    }

    const removeMember = (id) => {
      emit('remove-member', id)
    }

    // Edit functionality
    const startEdit = (member) => {
      editingMember.value = member.id
      editForm.value = {
        name: member.name,
        role: member.role
      }
    }

    const saveEdit = (id) => {
      if (editForm.value.name.trim() && editForm.value.role) {
        emit('edit-member', {
          id: id,
          name: editForm.value.name.trim(),
          role: editForm.value.role
        })
        cancelEdit()
      }
    }

    const cancelEdit = () => {
      editingMember.value = null
      editForm.value = { name: '', role: '' }
    }

    const getRoleClass = (role) => {
      const classes = {
        ADM: 'role-adm',
        PO: 'role-po',
        Eng: 'role-engineer',
        TL: 'role-lead',
        QA: 'role-qa'
      }
      return classes[role] || 'role-default'
    }

    const getRoleCardClass = (role) => {
      const classes = {
        ADM: 'card-adm',
        PO: 'card-po',
        Eng: 'card-engineer',
        TL: 'card-lead',
        QA: 'card-qa'
      }
      return classes[role] || 'card-default'
    }

    const getRoleLabel = (role) => {
      const labels = {
        ADM: 'ADM',
        PO: 'Product Owner',
        Eng: 'Engineer',
        TL: 'Tech Lead',
        QA: 'QA Engineer'
      }
      return labels[role] || role
    }

    const engineerCount = computed(() => {
      return props.teamMembers.filter(member => member.role === 'Eng').length
    })

    const roleDistribution = computed(() => {
      return props.teamMembers.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1
        return acc
      }, {})
    })

    return {
      newMemberName,
      newMemberRole,
      editingMember,
      editForm,
      roleTypes,
      addMember,
      removeMember,
      startEdit,
      saveEdit,
      cancelEdit,
      getRoleClass,
      getRoleCardClass,
      getRoleLabel,
      engineerCount,
      roleDistribution
    }
  }
}
</script>

<style scoped>
.team-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  color: white;
}

.header h1 {
  font-size: 2.5rem;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid white;
  color: white;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.team-member-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 6px solid #667eea;
  transition: all 0.3s ease;
}

/* Role-specific card colors */
.card-adm {
  border-left-color: #e53e3e;
  background: linear-gradient(135deg, #fed7d7 0%, #f8f9fa 50%);
}

.card-po {
  border-left-color: #38a169;
  background: linear-gradient(135deg, #d6f5d6 0%, #f8f9fa 50%);
}

.card-engineer {
  border-left-color: #3182ce;
  background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 50%);
}

.card-lead {
  border-left-color: #dd6b20;
  background: linear-gradient(135deg, #fff3e0 0%, #f8f9fa 50%);
}

.card-qa {
  border-left-color: #805ad5;
  background: linear-gradient(135deg, #f3e5f5 0%, #f8f9fa 50%);
}

.member-info {
  flex: 1;
}

.member-edit-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-input, .edit-select {
  margin-bottom: 0;
  padding: 6px 8px;
  font-size: 14px;
}

.member-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 15px;
}

.member-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.member-role {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
  font-weight: 500;
}

.role-adm {
  background: #fed7d7;
  color: #c53030;
  border: 1px solid #feb2b2;
}

.role-po {
  background: #d6f5d6;
  color: #2d7d32;
  border: 1px solid #9ae6b4;
}

.role-engineer {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #90cdf4;
}

.role-lead {
  background: #fff3e0;
  color: #ef6c00;
  border: 1px solid #fbb6ce;
}

.role-qa {
  background: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #d6bcfa;
}

.member-remove {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-edit {
  background: #4299e1;
  color: white;
  padding: 6px 12px;
  font-size: 12px;
}

.btn-edit:hover {
  background: #3182ce;
}

.btn-save {
  background: #48bb78;
  color: white;
  padding: 6px 12px;
  font-size: 12px;
}

.btn-save:hover {
  background: #38a169;
}

.btn-cancel {
  background: #a0aec0;
  color: white;
  padding: 6px 12px;
  font-size: 12px;
}

.btn-cancel:hover {
  background: #718096;
}

.role-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.legend-label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #718096;
  font-style: italic;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>