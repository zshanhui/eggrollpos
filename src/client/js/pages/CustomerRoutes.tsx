import React from 'react';

export default function CustomerRoutes(props: any) {
  const merchantId = props.match?.params?.merchantId;

  return (
    <section style={{ padding: '2rem' }}>
      <h1>Order Online</h1>
      <p>Merchant ID: {merchantId || 'none'}</p>
      <p>Public ordering menu coming soon.</p>
    </section>
  )
}
