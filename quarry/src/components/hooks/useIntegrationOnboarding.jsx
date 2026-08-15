import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'guardian_shield_integration_onboarding_complete';

export const useIntegrationOnboarding = () => {
  const [isComplete, setIsComplete] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setShowOnboarding(true);
      setIsComplete(false);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsComplete(true);
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
    setCurrentStep(0);
    setIsComplete(false);
  };

  return {
    showOnboarding,
    currentStep,
    isComplete,
    completeOnboarding,
    skipOnboarding,
    nextStep,
    prevStep,
    resetOnboarding,
  };
};
