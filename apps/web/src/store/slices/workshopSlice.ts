import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { WorkshopStep } from '@pulse/shared'

interface WorkshopEditorState {
  selectedStepId: string | null
  isDirty: boolean
  localSteps: WorkshopStep[]
  previewIndex: number
}

const initialState: WorkshopEditorState = {
  selectedStepId: null,
  isDirty: false,
  localSteps: [],
  previewIndex: 0,
}

export const workshopSlice = createSlice({
  name: 'workshop',
  initialState,
  reducers: {
    setSelectedStep(state, action: PayloadAction<string | null>) {
      state.selectedStepId = action.payload
    },
    setLocalSteps(state, action: PayloadAction<WorkshopStep[]>) {
      state.localSteps = action.payload
    },
    reorderSteps(state, action: PayloadAction<WorkshopStep[]>) {
      state.localSteps = action.payload
      state.isDirty = true
    },
    markClean(state) {
      state.isDirty = false
    },
    setPreviewIndex(state, action: PayloadAction<number>) {
      state.previewIndex = action.payload
    },
    resetEditor() {
      return initialState
    },
  },
})

export const {
  setSelectedStep,
  setLocalSteps,
  reorderSteps,
  markClean,
  setPreviewIndex,
  resetEditor,
} = workshopSlice.actions
