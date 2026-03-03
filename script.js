document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('header nav');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('is-active');
        nav.classList.toggle('is-open');
    });
});

/* Supabase: 
Has to load all entries from the table
if resolved dont load
load img, name, desc, etc. in each card.
*/

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://your-supabase-url.supabase.co', 'your-supabase-anon-key');

export default function lfGallery() {
    const [items, setItems] = useState([]); 

    useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase.from('items').select('*')
      setItems(data)
    }
    fetchItems()

    const channel = supabase
      .channel('lost_found_updates')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'items' }, 
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setItems((prev) => [payload.new, ...prev])
            }
          }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(item => (
        <div key={item.id} className="border p-4 rounded shadow">
          <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
          <h2 className="font-bold mt-2">{item.name}</h2>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  )
}