import type { ImageSourcePropType } from 'react-native';

import type { RoutineCategory } from '../types/category';

/**
 * Photography that carries the time of day and the mood of a routine. Each
 * category has one calm, real photograph; the app uses them where imagery
 * earns its place (the "Als Nächstes" card, routine details, onboarding) and
 * nowhere else, so the rest of the interface stays quiet.
 *
 * Source: Pixabay photographs (Pixabay Content License, free for commercial
 * use, no attribution required), obtained through the yavuzceliker/sample-images
 * archive and cropped to 3:2 at 1200×800. See `PHOTO_CREDITS` for the notice
 * shown in Settings.
 */
export const CATEGORY_PHOTOS: Record<RoutineCategory, ImageSourcePropType> = {
  morning: require('../../assets/photos/morning.jpg'),
  evening: require('../../assets/photos/evening.jpg'),
  health: require('../../assets/photos/health.jpg'),
  sport: require('../../assets/photos/sport.jpg'),
  learning: require('../../assets/photos/learning.jpg'),
  work: require('../../assets/photos/work.jpg'),
  household: require('../../assets/photos/household.jpg'),
  personal: require('../../assets/photos/personal.jpg'),
};

export const ONBOARDING_PHOTOS = {
  welcome: require('../../assets/photos/welcome.jpg') as ImageSourcePropType,
  dayStart: require('../../assets/photos/daystart.jpg') as ImageSourcePropType,
};

export function photoForCategory(category: RoutineCategory): ImageSourcePropType {
  return CATEGORY_PHOTOS[category];
}

export const PHOTO_CREDITS =
  'Die Fotos stammen von Pixabay (Pixabay Content License) und wurden über das Archiv „sample-images“ von Yavuz Çeliker bezogen.';
