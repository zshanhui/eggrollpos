import React from 'react';
import { useTranslation } from 'react-i18next';

export default function About(props) {
  const { t } = useTranslation();
  return(
    <section>
      {t('about.welcome')}
    </section>
  )
}
