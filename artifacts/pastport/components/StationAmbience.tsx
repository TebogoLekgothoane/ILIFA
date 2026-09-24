import { Asset } from 'expo-asset';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef } from 'react';
import stationAmbience from '@/assets/audio/download.mp3';

type StationAmbienceProps = {
  playing?: boolean;
  volume?: number;
};

export function StationAmbience({ playing = true, volume = 0.34 }: StationAmbienceProps) {
  const player = useAudioPlayer(stationAmbience, { updateInterval: 1000, downloadFirst: true });
  const status = useAudioPlayerStatus(player);
  const shouldPlay = useRef(playing);
  shouldPlay.current = playing;

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
      const asset = Asset.fromModule(stationAmbience);
      await asset.downloadAsync();
      if (cancelled) return;
      if (asset.localUri) player.replace({ uri: asset.localUri });
      player.loop = true;
      player.volume = volume;
      if (shouldPlay.current) player.play();
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  }, [player]);

  useEffect(() => {
    player.volume = volume;
  }, [player, volume]);

  useEffect(() => {
    if (!status.isLoaded) return;
    player.loop = true;
    if (playing) player.play();
    else player.pause();
  }, [playing, player, status.isLoaded]);

  return null;
}
