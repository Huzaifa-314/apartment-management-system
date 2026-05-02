import React from 'react';
import { Building2, Wifi, Car, Shield, Coffee, Dumbbell, Waves } from 'lucide-react';

/** Icon for a single amenity label (shared by public rooms and landing). */
export function getAmenityIcon(amenity: string): React.ReactNode {
  switch (amenity.toLowerCase()) {
    case 'wifi':
    case 'internet':
      return <Wifi className="h-4 w-4" />;
    case 'parking':
      return <Car className="h-4 w-4" />;
    case 'security':
      return <Shield className="h-4 w-4" />;
    case 'cafeteria':
    case 'cafe':
      return <Coffee className="h-4 w-4" />;
    case 'gym':
    case 'fitness':
      return <Dumbbell className="h-4 w-4" />;
    case 'swimming pool':
    case 'pool':
      return <Waves className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
  }
}
