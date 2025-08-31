import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, BookOpen, Award, MessageCircle, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/IMG_20250731_105128_697_1754300950174.jpg";
import heroImagePath from "@assets/3d-cartoon-portrait-person-practicing-law-related-profession_1754300347751.jpg";
import analyticsImagePath from "@assets/3d-female-character-holding-tablet-pointing-pie-chart_1754301410997.png";

const reviews = [
  {
    name: "Ananya Sharma",
    image: "https://i.pravatar.cc/150?img=1",
    rating: 5,
    comment: "This platform made studying so much easier. The tutor really understood where I needed help."
  },
  {
    name: "Rajeev Mehta", 
    image: "https://i.pravatar.cc/150?img=8",
    rating: 4,
    comment: "Very smooth experience. Scheduling and communication are simple and fast."
  },
  {
    name: "Neelam Rathi",
    image: "https://i.pravatar.cc/150?img=5", 
    rating: 5,
    comment: "I noticed real improvement within just a few sessions. Highly recommended!"
  },
  {
    name: "Kartik Iyer",
    image: "https://i.pravatar.cc/150?img=12",
    rating: 5,
    comment: "Direct chat feature is really helpful. It saves time and keeps everything clear."
  },
  {
    name: "Sneha Bansal",
    image: "https://i.pravatar.cc/150?img=9",
    rating: 5,
    comment: "Loved the flexibility of choosing between online and offline options. Works perfectly for our routine."
  },
  {
    name: "Ritesh Kumar",
    image: "https://i.pravatar.cc/150?img=14",
    rating: 4,
    comment: "Very user-friendly. Easy to find the right tutor based on my requirements."
  },
  {
    name: "Anil Verma",
    image: "https://i.pravatar.cc/150?img=15",
    rating: 5,
    comment: "It's a trustworthy platform. We've had a great experience so far."
  },
  {
    name: "Pooja Joshi",
    image: "https://i.pravatar.cc/150?img=16",
    rating: 5,
    comment: "Great support and quick response. The whole process is smooth and reliable."
  }
];

export default function Landing() {
  // Clear any invalid tokens on landing page load
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && (token === "null" || token === "undefined" || token === "")) {
      localStorage.removeItem("token");
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Enhanced Navigation */}
      <nav className="glass-gradient shadow-lg sticky top-0 z-40 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={logoPath} alt="Tutoro Logo" className="h-12 w-12 mr-3 rounded-lg hover-lift border-2 border-white/20 shadow-lg" />
              <span className="text-2xl font-bold text-black">Tutoro</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 interactive-hover">Home</a>
              <a href="#about" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 interactive-hover">About</a>
              <a href="#services" className="text-gray-700 hover:text-primary font-medium">Services</a>
              <a href="#contact" className="text-gray-700 hover:text-primary font-medium">Contact</a>
              <Link href="/login">
                <Button variant="outline" className="ml-4">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative py-16 sm:py-24 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0b453a, #0a3d32)' }}>
        {/* Clean background with gradient from dark to light green */}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
            {/* Content Section */}
            <div className="flex-1 text-white lg:pr-8">
              <div className="flex items-center mb-8">
                <div className="star-rating mr-3 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-current" />
                  ))}
                </div>
                <span className="text-lg font-medium text-white">
                  4.9 from 1.2k+ Reviews
                </span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-8">
                <span className="block text-white">Find Your</span>
                <span className="block text-orange-500">Perfect Tutor</span>
                <span className="block text-white">Today</span>
              </h1>
              
              <p className="text-xl sm:text-2xl md:text-3xl text-white/95 mb-12 leading-relaxed font-medium">
                Connect with qualified teachers near you. Chat instantly and start learning with personalized one-on-one tutoring sessions.
              </p>
              
              <div className="flex flex-col gap-5 mb-12 max-w-md">
                <Link href="/register-student">
                  <Button 
                    size="lg"
                    className="group bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-xl px-8 py-6 sm:px-10 sm:py-7 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold w-full active:scale-95 touch-manipulation"
                    data-testid="button-find-tutors"
                  >
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    Find Tutors
                  </Button>
                </Link>
                <Link href="/register-teacher">
                  <Button 
                    size="lg"
                    className="group text-white text-xl px-8 py-6 sm:px-10 sm:py-7 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold border-2 w-full active:scale-95 touch-manipulation"
                    style={{ backgroundColor: '#0b453a', borderColor: '#0d5540' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d5540'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0b453a'}
                    onTouchStart={(e) => e.currentTarget.style.backgroundColor = '#0d5540'}
                    onTouchEnd={(e) => e.currentTarget.style.backgroundColor = '#0b453a'}
                    data-testid="button-become-tutor"
                  >
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    Become a Tutor
                  </Button>
                </Link>
              </div>
              

            </div>
            
            {/* Image Section - Desktop: beside, Mobile: below */}
            <div className="flex-shrink-0 lg:w-1/2 order-last lg:order-none">
              <div className="relative">
                <img 
                  src={heroImagePath}
                  alt="Professional Teacher" 
                  className="w-full max-w-md mx-auto lg:max-w-none lg:w-full h-auto object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute -top-4 -right-4 bg-yellow-400 rounded-full p-3 shadow-lg animate-pulse">
                  <CheckCircle className="w-6 h-6 text-emerald-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how Tutoro has transformed learning experiences across our community
            </p>
          </div>

          <div className="relative flex justify-center items-center">
            {/* Central Analytics Image */}
            <div className="relative z-10">
              <img 
                src={analyticsImagePath}
                alt="Analytics Dashboard" 
                className="w-96 h-96 md:w-[500px] md:h-[500px] object-contain drop-shadow-2xl"
              />
            </div>

            {/* Floating Analytics Cards */}
            {/* Happy Parents - Far Left */}
            <div className="absolute top-16 -left-4 md:top-20 md:-left-8 lg:-left-16 bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-gray-100 animate-float z-20">
              <div className="text-center">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  450+
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-600 mt-1">Happy Parents</div>
                <div className="text-xs text-emerald-600 mt-1">in last year</div>
              </div>
            </div>

            {/* Students - Far Right */}
            <div className="absolute top-16 -right-4 md:top-20 md:-right-8 lg:-right-16 bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-gray-100 animate-float z-20" style={{animationDelay: '1s'}}>
              <div className="text-center">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  560+
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-600 mt-1">Students</div>
                <div className="text-xs text-blue-600 mt-1">in last year</div>
              </div>
            </div>

            {/* Teachers - Far Bottom */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 md:-bottom-8 lg:-bottom-12 bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-gray-100 animate-float z-20" style={{animationDelay: '2s'}}>
              <div className="text-center">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  126+
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-600 mt-1">Expert Teachers</div>
                <div className="text-xs text-orange-600 mt-1">in last year</div>
              </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full blur-3xl opacity-30 -z-10"></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 -z-10"></div>
          </div>

          {/* Additional Achievement Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="text-center bg-white rounded-xl p-4 shadow-md">
              <div className="text-2xl font-bold text-emerald-600">98%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center bg-white rounded-xl p-4 shadow-md">
              <div className="text-2xl font-bold text-blue-600">4.9★</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center bg-white rounded-xl p-4 shadow-md">
              <div className="text-2xl font-bold text-purple-600">24/7</div>
              <div className="text-sm text-gray-600">Support</div>
            </div>
            <div className="text-center bg-white rounded-xl p-4 shadow-md">
              <div className="text-2xl font-bold text-orange-600">50+</div>
              <div className="text-sm text-gray-600">Subjects</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Tutoro?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the best in educational matchmaking with our advanced features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Verified Teachers */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-3xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="bg-emerald-500 rounded-full p-3 mr-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Verified Teachers Only</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                All tutors are background-checked and quality-assured for your peace of mind and learning success.
              </p>
            </div>

            {/* Direct Chat */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 rounded-full p-3 mr-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Direct Chat with Tutors</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Message your matched tutor instantly — no delays, no middleman, just direct communication.
              </p>
            </div>

            {/* Online & Offline */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-3xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="bg-purple-500 rounded-full p-3 mr-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Online & Offline Learning</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Choose between virtual sessions or nearby in-person lessons based on your preference.
              </p>
            </div>

            {/* Nearby Tutors */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-3xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="bg-orange-500 rounded-full p-3 mr-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Connect With Nearby Tutors</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Smart matching based on location and learning goals to find the perfect educational partner.
              </p>
            </div>

            {/* Requirement-Based Search */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-3xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="bg-pink-500 rounded-full p-3 mr-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Requirement-Based Search</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Filter tutors by subject, grade, availability, language, and more for precise matching.
              </p>
            </div>

            {/* Additional Feature - Premium Support */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-3xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center mb-4">
                <div className="bg-teal-500 rounded-full p-3 mr-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Premium Support</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                24/7 customer support to ensure your learning journey is smooth and successful.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Our Students Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real experiences from our learning community
            </p>
          </div>

          {/* Auto-sliding Reviews Container */}
          <div className="relative">
            <div className="overflow-hidden">
              <div className="flex animate-slide-infinite space-x-6">
                {/* First set of reviews */}
                {reviews.map((review, index) => (
                  <div key={index} className="flex-shrink-0 w-64">
                    <div className="bg-white rounded-3xl p-4 shadow-lg border border-gray-100 h-full">
                      {/* Rating Stars */}
                      <div className="flex mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      
                      {/* Review Text */}
                      <p className="text-gray-900 text-sm leading-relaxed mb-4 font-medium">
                        "{review.comment}"
                      </p>
                      
                      {/* User Info */}
                      <div className="flex items-center">
                        <img 
                          src={review.image} 
                          alt={review.name} 
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                        <div>
                          <h4 className="font-bold text-emerald-600 text-base">{review.name}</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Duplicate set for seamless loop */}
                {reviews.map((review, index) => (
                  <div key={`duplicate-${index}`} className="flex-shrink-0 w-64">
                    <div className="bg-white rounded-3xl p-4 shadow-lg border border-gray-100 h-full">
                      {/* Rating Stars */}
                      <div className="flex mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      
                      {/* Review Text */}
                      <p className="text-gray-900 text-sm leading-relaxed mb-4 font-medium">
                        "{review.comment}"
                      </p>
                      
                      {/* User Info */}
                      <div className="flex items-center">
                        <img 
                          src={review.image} 
                          alt={review.name} 
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                        <div>
                          <h4 className="font-bold text-emerald-600 text-base">{review.name}</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Start Learning Section */}
      <section className="relative py-20 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0b453a, #0a3d32)' }}>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Ready to Start Learning?
            </h2>
            
            <p className="text-xl md:text-2xl leading-relaxed mb-12 text-white/90">
              Join thousands of students who have found their perfect tutors on Tutoro
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-lg mx-auto">
              <Link href="/register-student">
                <Button 
                  size="lg"
                  className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold w-full"
                  data-testid="button-find-tutor-now"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Find Your Tutor Now
                </Button>
              </Link>
              <Link href="/register-teacher">
                <Button 
                  size="lg"
                  className="group text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold border-2 w-full"
                  style={{ backgroundColor: '#0b453a', borderColor: '#0d5540' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d5540'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0b453a'}
                  data-testid="button-become-tutor-cta"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Become a Tutor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
