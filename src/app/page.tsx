'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Three.js scene component with SSR disabled
const ThreeScene = dynamic(() => import('@/components/ThreeScene'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: 'var(--text-secondary)',
      gap: '12px'
    }}>
      <div className="statusIndicator pulse" style={{ width: '12px', height: '12px' }}></div>
      <span style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>BOOTING GRAPHICS ENGINE...</span>
    </div>
  ),
});

const ANIMAL_DATA = {
  giraffe: {
    name: 'Giraffe (Jerapah)',
    scientificName: 'Giraffa camelopardalis',
    status: 'Vulnerable',
    statusColor: '245, 158, 11',
    description: 'The tallest living terrestrial animal and the largest ruminant. It is easily distinguished by its extremely long neck and legs, and its distinctive coat patterns.',
    stats: {
      Height: 'Up to 5.7 m',
      Speed: '60 km/h',
      Diet: 'Herbivore',
      Weight: '1,200 kg'
    },
    funFacts: [
      "Giraffes only need 5 to 30 minutes of sleep per 24 hours, often taken in quick naps.",
      "A giraffe's heart weighs about 11 kg (25 lb) and pumps blood at double normal blood pressure to reach their brain.",
      "Just like human fingerprints, no two giraffes have the exact same spot pattern."
    ]
  },
  antelope: {
    name: 'Antelope',
    scientificName: 'Antilocapra americana',
    status: 'Least Concern',
    statusColor: '16, 185, 129',
    description: 'Elegant and agile grazers native to savannahs and grasslands. Known for their extreme speed and endurance to evade predators.',
    stats: {
      Height: '0.9 m',
      Speed: '88 km/h',
      Diet: 'Herbivore',
      Weight: '60 kg'
    },
    funFacts: [
      "Antelopes have wide-set eyes that let them see almost 360 degrees, helping them detect predators.",
      "They can make vertical leaps of up to 3 meters (10 feet) to startle and outmaneuver predators.",
      "Their horns are made of bone covered in keratin (like human fingernails) and never stop growing."
    ]
  },
  cheetah: {
    name: 'Cheetah',
    scientificName: 'Acinonyx jubatus',
    status: 'Vulnerable',
    statusColor: '245, 158, 11',
    description: 'The fastest land mammal on Earth, designed for short, explosive bursts of speed. Characterized by its slender body, deep chest, spotted coat, and tear stripes.',
    stats: {
      Height: '0.8 m',
      Speed: '120 km/h',
      Diet: 'Carnivore',
      Weight: '54 kg'
    },
    funFacts: [
      "Cheetahs can accelerate from 0 to 97 km/h (60 mph) in just 3 seconds, faster than many sports cars.",
      "Unlike other big cats, cheetahs cannot roar; instead, they purr like house cats when content.",
      "Their black 'tear tracks' run from their eyes to their mouth, absorbing glare from the hot sun."
    ]
  }
};

export default function Home() {
  const shape = 'zoo_terrain';
  const color = '#ffd085';
  const customMaterial = false;
  const [selectedAnimal, setSelectedAnimal] = useState<'giraffe' | 'antelope' | 'cheetah' | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const ANIMALS: Array<'giraffe' | 'antelope' | 'cheetah'> = ['giraffe', 'antelope', 'cheetah'];

  const handleNext = () => {
    if (!selectedAnimal) return;
    const currentIndex = ANIMALS.indexOf(selectedAnimal);
    const nextIndex = (currentIndex + 1) % ANIMALS.length;
    setSelectedAnimal(ANIMALS[nextIndex]);
  };

  const handlePrev = () => {
    if (!selectedAnimal) return;
    const currentIndex = ANIMALS.indexOf(selectedAnimal);
    const prevIndex = (currentIndex - 1 + ANIMALS.length) % ANIMALS.length;
    setSelectedAnimal(ANIMALS[prevIndex]);
  };

  return (
    <div className="appContainer">
      {/* 3D WebGL Canvas Layer */}
      <main className="canvasContainer" aria-label="3D WebGL Scene">
        <ThreeScene 
          shape={shape} 
          color={color} 
          customMaterial={customMaterial}
          selectedAnimal={selectedAnimal}
          onSelectAnimal={setSelectedAnimal}
          onLoaded={() => setIsLoaded(true)}
        />
      </main>

      {/* Splash / Login Overlay */}
      {showSplash && (
        <div className={`splashContainer ${hasStarted ? 'fadeOut' : ''}`}>
          <div className="splashContent">
            <img src="/Logo.png" alt="Zoo Logo" className="splashLogo" />
            
            {!isLoaded ? (
              <div className="splashLoadingContainer">
                <div className="splashProgressBarContainer">
                  <div className="splashProgressBar"></div>
                </div>
                <span className="splashLoadingText">Loading Wildlife Sanctuary...</span>
              </div>
            ) : (
              <button 
                className="startBtn"
                onClick={() => {
                  setHasStarted(true);
                  setTimeout(() => setShowSplash(false), 800);
                }}
              >
                Start Experience
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating UI HUD Overlay */}
      <div 
        className="uiOverlay"
        style={{ 
          opacity: hasStarted ? 1 : 0, 
          transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s, visibility 0.6s step-end 0.2s',
          visibility: hasStarted ? 'visible' : 'hidden'
        } as React.CSSProperties}
      >
        {/* Top Floating Dynamic Island */}
        <div className={`dynamicIsland ${selectedAnimal ? 'profileMode' : 'exploreMode'}`}>
          {!selectedAnimal ? (
            <div className="islandContent explore">
              <span className="islandLabel">Quick Pick:</span>
              <button className="islandBtn" onClick={() => setSelectedAnimal('giraffe')}>
                Jerapah
              </button>
              <span className="islandDivider">|</span>
              <button className="islandBtn" onClick={() => setSelectedAnimal('antelope')}>
                Antelope
              </button>
              <span className="islandDivider">|</span>
              <button className="islandBtn" onClick={() => setSelectedAnimal('cheetah')}>
                Cheetah
              </button>
            </div>
          ) : (
            <div className="islandContent profile">
              <button className="islandNavBtn" onClick={handlePrev} aria-label="Previous animal">
                ◀
              </button>
              <div className="islandActiveAnimal">
                {selectedAnimal === 'giraffe' && 'Jerapah'}
                {selectedAnimal === 'antelope' && 'Antelope'}
                {selectedAnimal === 'cheetah' && 'Cheetah'}
              </div>
              <button className="islandNavBtn" onClick={handleNext} aria-label="Next animal">
                ▶
              </button>
              <span className="islandDivider">|</span>
              <button className="islandHomeBtn" onClick={() => setSelectedAnimal(null)} aria-label="Back to Terrain">
                Map
              </button>
            </div>
          )}
        </div>

        {selectedAnimal && (
          <div className="glassPanel infoCard animateSlideIn" id="animal-info-card">
            <button className="closeBtn" onClick={() => setSelectedAnimal(null)} aria-label="Close profile">
              ✕
            </button>
            <span className="scientificName">{ANIMAL_DATA[selectedAnimal].scientificName}</span>
            <h2 className="animalName">{ANIMAL_DATA[selectedAnimal].name}</h2>
            <div className="statusBadge" style={{ '--badge-color': ANIMAL_DATA[selectedAnimal].statusColor } as React.CSSProperties}>
              {ANIMAL_DATA[selectedAnimal].status}
            </div>
            
            <p className="description">{ANIMAL_DATA[selectedAnimal].description}</p>
            
            <div className="statsGrid">
              {Object.entries(ANIMAL_DATA[selectedAnimal].stats).map(([key, value]) => (
                <div key={key} className="statBox">
                  <span className="statLabel">{key}</span>
                  <span className="statValue">{value}</span>
                </div>
              ))}
            </div>

            <div className="funFactsSection">
              <h4 className="funFactsTitle">Fun Facts</h4>
              <ul className="funFactsList">
                {ANIMAL_DATA[selectedAnimal].funFacts.map((fact, index) => (
                  <li key={index} className="funFactItem">{fact}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Navigation & Camera Control tips */}
        <div className="glassPanel cameraControls" id="navigation-tips">
          <span>Left-Click + Drag: <strong>Rotate Camera</strong></span>
          <span>Right-Click + Drag: <strong>Pan</strong></span>
          <span>Scroll: <strong>Zoom</strong></span>
        </div>
      </div>
    </div>
  );
}
