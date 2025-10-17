import { ref, onUnmounted } from 'vue'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db, TEAM_ID } from '../firebase.js'

export function useFirestore(collectionName) {
  const data = ref([])
  const loading = ref(true)
  const error = ref(null)

  // Create collection reference
  const collectionRef = collection(db, 'teams', TEAM_ID, collectionName)

  // Set up real-time listener
  let unsubscribe = null

  const startListening = (orderByField = null) => {
    loading.value = true
    error.value = null

    try {
      const q = orderByField
        ? query(collectionRef, orderBy(orderByField, 'desc'))
        : collectionRef

      unsubscribe = onSnapshot(q, (snapshot) => {
        data.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        loading.value = false
      }, (err) => {
        console.error('Firestore error:', err)
        error.value = err.message
        loading.value = false
      })
    } catch (err) {
      console.error('Error setting up listener:', err)
      error.value = err.message
      loading.value = false
    }
  }

  // Add document
  const add = async (docData) => {
    try {
      const docToAdd = {
        ...docData,
        timestamp: serverTimestamp()
      }
      const docRef = await addDoc(collectionRef, docToAdd)
      return docRef.id
    } catch (err) {
      console.error('Error adding document:', err)
      error.value = err.message
      throw err
    }
  }

  // Update document
  const update = async (id, updates) => {
    try {
      const docRef = doc(collectionRef, id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error updating document:', err)
      error.value = err.message
      throw err
    }
  }

  // Delete document
  const remove = async (id) => {
    try {
      const docRef = doc(collectionRef, id)
      await deleteDoc(docRef)
    } catch (err) {
      console.error('Error deleting document:', err)
      error.value = err.message
      throw err
    }
  }

  // Cleanup listener on unmount
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return {
    data,
    loading,
    error,
    startListening,
    add,
    update,
    remove
  }
}

// Specialized composable for simple key-value storage (like settings)
export function useFirestoreDocument(collectionName, documentId = 'default') {
  const data = ref({})
  const loading = ref(true)
  const error = ref(null)

  // Create document reference with proper even number of segments
  const docRef = doc(db, 'teams', TEAM_ID, collectionName, documentId)

  let unsubscribe = null

  const startListening = () => {
    loading.value = true
    error.value = null

    try {
      unsubscribe = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          data.value = doc.data()
        } else {
          data.value = {}
        }
        loading.value = false
      }, (err) => {
        console.error('Firestore document error:', err)
        error.value = err.message
        loading.value = false
      })
    } catch (err) {
      console.error('Error setting up document listener:', err)
      error.value = err.message
      loading.value = false
    }
  }

  const update = async (updates) => {
    try {
      const docData = {
        ...data.value,
        ...updates,
        updatedAt: serverTimestamp()
      }
      await setDoc(docRef, docData, { merge: true })
    } catch (err) {
      console.error('Error updating document:', err)
      error.value = err.message
      throw err
    }
  }

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return {
    data,
    loading,
    error,
    startListening,
    update
  }
}