// Enhanced GPS Location Utility Functions
import { toast } from "@/hooks/use-toast";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  fullAddress?: string;
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  showAccuracyWarning?: boolean;
  requireHighAccuracy?: boolean;
}

/**
 * Check current location permission status
 */
export async function checkLocationPermission(): Promise<PermissionState> {
  try {
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    }
    return 'prompt'; // Default to prompt if permission API is not available
  } catch (error) {
    return 'prompt';
  }
}

/**
 * Request location permission by attempting to get current position
 */
export async function requestLocationPermission(): Promise<GeolocationPosition> {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS स्पोर्ट नहीं है इस डिवाइस पर। कृपया GPS वाला डिवाइस उपयोग करें।"));
      return;
    }

    // Show immediate toast to user about permission
    toast({
      title: "लोकेशन एक्सेस की अनुमति चाहिए",
      description: "कृपया ब्राउज़र में 'Allow' पर क्लिक करें ताकि हम आपकी सटीक लोकेशन पा सकें।",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast({
          title: "लोकेशन एक्सेस मिल गई!",
          description: "अब हम आपकी सटीक लोकेशन निकाल रहे हैं...",
        });
        resolve(position);
      },
      (error) => {
        let message = "लोकेशन एक्सेस नहीं मिली। ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += "कृपया ब्राउज़र सेटिंग्स में लोकेशन एक्सेस को Allow करें और फिर से कोशिश करें।";
            break;
          case error.POSITION_UNAVAILABLE:
            message += "लोकेशन की जानकारी उपलब्ध नहीं है। कृपया अपनी GPS सेटिंग्स चेक करें।";
            break;
          case error.TIMEOUT:
            message += "लोकेशन का समय समाप्त हो गया। कृपया फिर से कोशिश करें।";
            break;
          default:
            message += "लोकेशन लेने में अज्ञात त्रुटि हुई।";
            break;
        }
        toast({
          title: "लोकेशन एक्सेस की समस्या",
          description: message,
          variant: "destructive",
        });
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

/**
 * Get current GPS location with enhanced accuracy and error handling
 */
export function getCurrentLocationEnhanced(
  options: LocationOptions = {}
): Promise<LocationData> {
  const {
    enableHighAccuracy = true,
    timeout = 20000,
    maximumAge = 300000,
    showAccuracyWarning = true,
    requireHighAccuracy = false,
  } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const error = new Error("GPS स्पोर्ट नहीं है इस डिवाइस पर");
      reject(error);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Check accuracy requirements
        if (requireHighAccuracy && accuracy > 50) {
          const error = new Error(
            `Location accuracy ${accuracy.toFixed(0)}m is not sufficient. Please enable GPS and try outdoors.`
          );
          reject(error);
          return;
        }

        // Show accuracy warning if needed
        if (showAccuracyWarning && accuracy > 100) {
          toast({
            title: "Location Accuracy Notice",
            description: `GPS accuracy: ${accuracy.toFixed(0)}m. ${
              accuracy > 200 ? "Consider moving outdoors for better accuracy." : ""
            }`,
          });
        }

        const locationData: LocationData = {
          latitude,
          longitude,
          accuracy,
        };

        resolve(locationData);
      },
      (error) => {
        let errorMessage = "Unable to get your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "लोकेशन की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में लोकेशन एक्सेस allow करें।";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "GPS लोकेशन उपलब्ध नहीं है। कृपया location services को enable करें।";
            break;
          case error.TIMEOUT:
            errorMessage = "लोकेशन रिक्वेस्ट का समय समाप्त हो गया। कृपया फिर से कोशिश करें या बेहतर GPS कवरेज वाली जगह जाएं।";
            break;
        }

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  });
}

/**
 * Get address details from coordinates using multiple geocoding services
 */
export async function geocodeLocation(
  latitude: number,
  longitude: number
): Promise<LocationData> {
  let addressData: LocationData = {
    latitude,
    longitude,
    accuracy: 0,
    fullAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    street: '',
    city: '',
    state: '',
    pinCode: '',
  };

  try {
    // Primary service - BigDataCloud
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );

    if (response.ok) {
      const data = await response.json();
      console.log('BigDataCloud response:', data);
      
      addressData = {
        ...addressData,
        fullAddress: data.locality || `${data.city || ''}, ${data.principalSubdivision || ''}, ${data.countryName || ''}`.replace(/^,\s*|,\s*$/g, ''),
        street: data.localityInfo?.administrative?.[0]?.name || data.locality || data.district || '',
        city: data.city || data.locality || data.district || '',
        state: data.principalSubdivision || data.principalSubdivisionCode || '',
        pinCode: data.postcode || data.postalCode || '',
      };
      
      console.log('Geocoded address data:', addressData);
      return addressData;
    }
  } catch (error) {
    console.log('Primary geocoding service failed, trying fallback');
  }

  try {
    // Fallback service - OpenStreetMap Nominatim
    const fallbackResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );

    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      const address = fallbackData.address || {};
      
      console.log('Nominatim response:', fallbackData);
      
      addressData = {
        ...addressData,
        fullAddress: fallbackData.display_name || `${latitude}, ${longitude}`,
        street: address.road || address.house_number || address.suburb || address.neighbourhood || '',
        city: address.city || address.town || address.village || address.municipality || address.county || '',
        state: address.state || address.province || address['state_district'] || '',
        pinCode: address.postcode || address.postal_code || '',
      };
      
      console.log('Nominatim geocoded address:', addressData);
    }
  } catch (error) {
    console.log('Fallback geocoding service also failed');
  }

  return addressData;
}

/**
 * Get complete location data with GPS coordinates and address
 */
export async function getCompleteLocationData(
  options: LocationOptions = {}
): Promise<LocationData> {
  const locationData = await getCurrentLocationEnhanced(options);
  const addressData = await geocodeLocation(locationData.latitude, locationData.longitude);
  
  return {
    ...addressData,
    accuracy: locationData.accuracy,
  };
}

/**
 * Open Google Maps directions with enhanced GPS accuracy
 */
export async function openDirections(
  destinationLat?: string | number,
  destinationLng?: string | number, 
  destinationAddress?: string,
  options: LocationOptions = {}
): Promise<void> {
  if (!destinationAddress && (!destinationLat || !destinationLng)) {
    throw new Error("Destination location not available");
  }

  toast({
    title: "Getting Your Location",
    description: "Please wait while we get your precise location for accurate directions...",
  });

  try {
    const locationData = await getCurrentLocationEnhanced({
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 300000,
      showAccuracyWarning: true,
      ...options,
    });

    const destination = destinationLat && destinationLng 
      ? `${destinationLat},${destinationLng}` 
      : destinationAddress;

    const mapsUrl = `https://www.google.com/maps/dir/${locationData.latitude},${locationData.longitude}/${destination}`;
    window.open(mapsUrl, '_blank');

  } catch (error: any) {
    toast({
      title: "Location Error",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }
}

/**
 * Calculate distance between two GPS coordinates (in kilometers)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Watch user's location changes for real-time tracking
 */
export function watchLocation(
  callback: (locationData: LocationData) => void,
  options: LocationOptions = {}
): () => void {
  if (!navigator.geolocation) {
    throw new Error("GPS not supported on this device");
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      callback({ latitude, longitude, accuracy });
    },
    (error) => {
      console.log("Watch position error:", error);
    },
    {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      maximumAge: options.maximumAge ?? 30000,
      timeout: options.timeout ?? 10000,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}