import { useState, useEffect } from 'react';

// Adapted from https://usehooks.com/useWindowSize/
export function useWindowSize() {
  const isClient = typeof window === 'object';

  function getSize() {
    return {
      width: isClient ? window.innerWidth : undefined,
      height: isClient ? window.innerHeight : undefined
    };
  }

  const [windowSize, setWindowSize] = useState(getSize);

  useEffect(() => {
    if (!isClient) {
      return null;
    }

    function handleResize() {
      setWindowSize(getSize());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return windowSize;
}

export async function getData(){
  const response = await fetch('/api/data');
  const body = await response.json();
  if (response.status !== 200) throw Error(body.message);
  return body;
};

export async function postData(data: string){
  const response = await fetch('/api/data', {
    method: 'POST',
    body: data,
    headers: {'content-type': 'application/json', 'Accept-Charset': 'UTF-8'},
  });
  const body = await response;
  if (!response.ok) throw Error(body.statusText);
  return body;
};
