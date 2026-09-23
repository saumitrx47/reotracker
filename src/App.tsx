import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Deliveries from './pages/Deliveries'
import Reconciliation from './pages/Reconciliation'
import Forecast from './pages/Forecast'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="reconciliation" element={<Reconciliation />} />
        <Route path="forecast" element={<Forecast />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
