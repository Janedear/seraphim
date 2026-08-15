import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'aidetection_onboarding_complete';

export const useOnboarding = (featureId = 'aidetection') => {
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(`${ONBOARDING_KEY}_${featureId}`);
    if (!completed) {
      setShowOnboarding(true);
    } else {
      setIsComplete(true);
    }
  }, [featureId]);

  const completeOnboarding = () => {
    localStorage.setItem(`${ONBOARDING_KEY}_${featureId}`, 'true');
    setIsComplete(true);
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const resetOnboarding = () => {
    localStorage.removeItem(`${ONBOARDING_KEY}_${featureId}`);
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
    resetOnboarding
  };
};