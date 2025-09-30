import { CRMApp } from '@/components/CRMApp';

interface IndexProps {
  onLogout: () => void;
}

const Index = ({ onLogout }: IndexProps) => {
  return <CRMApp onLogout={onLogout} />;
};

export default Index;
