import { useState, useEffect } from 'react';
import { CustomIcon, GlobalForumIconSetting } from '../types/icon';
import { getCustomIcon, subscribeGlobalForumIconConfig } from '../lib/icons';

export const useGlobalForumIcon = () => {
  const [setting, setSetting] = useState<GlobalForumIconSetting | null>(null);
  const [icon, setIcon] = useState<CustomIcon | null>(null);
  const [settingLoaded, setSettingLoaded] = useState(false);
  const [iconLoading, setIconLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeGlobalForumIconConfig((nextSetting) => {
      setSetting(nextSetting);
      setSettingLoaded(true);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const targetIconId = setting?.iconId ?? null;

  useEffect(() => {
    let cancelled = false;

    if (!targetIconId) {
      setIcon(null);
      setIconLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIconLoading(true);
    getCustomIcon(targetIconId)
      .then((resolved) => {
        if (!cancelled) {
          setIcon(resolved);
          setIconLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIcon(null);
          setIconLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [targetIconId]);

  return {
    setting,
    icon,
    loading: !settingLoaded || iconLoading,
  };
};
