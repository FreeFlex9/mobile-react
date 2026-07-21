import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { PrestadorDashboard } from '@/components/dashboard/PrestadorDashboard';
import { EmpresaDashboard } from '@/components/dashboard/EmpresaDashboard';

export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {user?.user_type === 'empresa' ? <EmpresaDashboard /> : <PrestadorDashboard />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F7' },
});
