import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PeopleExperiencesSection } from '@/components/PeopleExperiencesSection';
import { station } from '@/data/pastport';

const mockAddSharedExperience = jest.fn();

jest.mock('@/context/PastportContext', () => ({
  usePastport: () => ({
    sharedExperiences: [],
    addSharedExperience: mockAddSharedExperience,
  }),
}));

jest.mock('@/components/ExploreMap', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'people-experiences-map' }),
  };
});

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    VideoView: () => React.createElement(View, { testID: 'story-video' }),
    useVideoPlayer: () => ({ play: jest.fn(), pause: jest.fn(), loop: false }),
  };
});

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn() }),
  useAudioPlayerStatus: () => ({ playing: false, isLoaded: true }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('PeopleExperiencesSection', () => {
  it('renders a location-aware story feed rather than a review list', () => {
    const screen = render(
      <PeopleExperiencesSection siteId={station.id} siteName={station.name} coordinates={station.coordinates} />,
    );

    expect(screen.getByText('You are exploring East London Railway Station')).toBeTruthy();
    expect(screen.getByText('People Who Experienced This Place')).toBeTruthy();
    expect(screen.getByText('See what other people remember, felt and discovered here.')).toBeTruthy();
    expect(screen.getByTestId('people-experiences-map')).toBeTruthy();
    expect(screen.getByText('Nomhle M.')).toBeTruthy();
    expect(screen.getAllByText('Community Storykeeper').length).toBeGreaterThan(0);
    expect(screen.getByTestId('people-experience-photos-nomhle-m')).toBeTruthy();
    expect(screen.getByText('Sipho K.')).toBeTruthy();
    expect(screen.getByTestId('people-experience-photos-sipho-k')).toBeTruthy();
    expect(screen.getByText(/I never knew this place had this history/)).toBeTruthy();
    expect(screen.queryByText('Fatima A.')).toBeNull();
    expect(screen.getByText('What was your experience?')).toBeTruthy();
    expect(screen.getByText('Add your voice to the history of this place.')).toBeTruthy();
    expect(screen.getByText('History tells you what happened here.\nPeople tell you what this place means.')).toBeTruthy();
  });

  it('can speak to the neighbourhood around you, not only one building', () => {
    const screen = render(
      <PeopleExperiencesSection
        siteId={station.id}
        siteName={station.name}
        coordinates={station.coordinates}
        radius={2000}
        areaAware
      />,
    );

    expect(screen.getByText("People's Experiences Around You")).toBeTruthy();
    expect(screen.getByText(/Near East London Railway Station/)).toBeTruthy();
    expect(screen.queryByText('People Who Experienced This Place')).toBeNull();
  });

  it('opens a human story, then lets a visitor share their own', () => {
    const screen = render(
      <PeopleExperiencesSection siteId={station.id} siteName={station.name} coordinates={station.coordinates} />,
    );

    fireEvent.press(screen.getByTestId('people-experience-card-nomhle-m'));
    expect(screen.getByTestId('people-experience-sheet')).toBeTruthy();
    expect(screen.getByText('COMMUNITY STORYKEEPER')).toBeTruthy();
    expect(screen.getByText('Show translation')).toBeTruthy();
    fireEvent.press(screen.getByTestId('people-experience-close'));

    fireEvent.press(screen.getByTestId('share-experience-write'));
    expect(screen.getByTestId('share-experience-sheet')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('share-experience-name'), 'Anele');
    fireEvent.changeText(screen.getByTestId('share-experience-body'), 'The clock still organises this city.');
    fireEvent.press(screen.getByTestId('share-experience-submit'));

    expect(mockAddSharedExperience).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Anele',
        quote: 'The clock still organises this city.',
        siteId: station.id,
        userSubmitted: true,
      }),
    );
  });
});
