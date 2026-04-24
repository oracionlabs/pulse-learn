import { configureStore } from '@reduxjs/toolkit'
import { workshopSlice } from './slices/workshopSlice'

export const store = configureStore({
  reducer: {
    workshop: workshopSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
