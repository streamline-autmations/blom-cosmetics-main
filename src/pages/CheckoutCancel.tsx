import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Container } from '../components/layout/Container';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showMobileMenu={true} />
      <main className="section-padding">
        <Container>
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <h2 className="text-2xl font-bold">Payment cancelled</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">No worries—your card wasn’t charged.</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => (window.location.href = '/cart')}>Back to cart</Button>
                <Button onClick={() => (window.location.href = '/shop')}>Continue shopping</Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </main>
      <Footer />
    </div>
  );
}


