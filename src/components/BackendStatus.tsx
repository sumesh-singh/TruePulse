
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const BackendStatus = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/health', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus('online');
          setDetails(`Model: ${data.model_status || 'unknown'}`);
        } else {
          setStatus('offline');
          setDetails(`HTTP ${response.status}`);
        }
      } catch (error) {
        setStatus('offline');
        setDetails('Connection failed');
        console.error('Backend health check failed:', error);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge 
        variant={status === 'online' ? 'default' : 'destructive'} 
        className="flex items-center gap-2 px-3 py-1"
      >
        {status === 'checking' && <Loader2 className="h-3 w-3 animate-spin" />}
        {status === 'online' && <CheckCircle className="h-3 w-3" />}
        {status === 'offline' && <XCircle className="h-3 w-3" />}
        <span className="text-xs">
          Backend: {status} {details && `(${details})`}
        </span>
      </Badge>
    </div>
  );
};

export default BackendStatus;
