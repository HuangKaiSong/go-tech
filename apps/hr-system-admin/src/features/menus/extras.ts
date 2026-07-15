import NewFeatureMenuExtra from './components/NewFeatureMenuExtra';
import ReleaseChannelMenuExtra from './components/ReleaseChannelMenuExtra';

export const menuExtras = {
  NewFeature: NewFeatureMenuExtra,
  ReleaseChannel: ReleaseChannelMenuExtra
};

export type ExtraKey = keyof typeof menuExtras;
