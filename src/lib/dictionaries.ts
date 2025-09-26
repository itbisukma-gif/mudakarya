

import { Home, Star, Pin, FileText, ArrowLeft, User, Building } from 'lucide-react';

const id = {
    loading: "Memuat",
    navLinks: [
      { href: "/", label: "Home", icon: Home },
      { href: "/profil", label: "Profil", icon: Building },
      { href: "/testimoni", label: "Testimoni", icon: Star },
      { href: "/kontak", label: "Alamat", icon: Pin },
      { href: "/syarat-ketentuan", label: "S&K", icon: FileText },
    ],
    footer: {
      description: "Solusi rental mobil terbaik dengan layanan profesional dan armada terawat.",
      navigation: "Navigasi",
      contactUs: "Hubungi Kami",
      copyright: (year: number) => `© ${year} MudaKarya RentCar. Hak cipta dilindungi undang-undang.`,
      navLinks: [
        { href: "/", label: "Home" },
        { href: "/profil", label: "Profil Perusahaan" },
        { href: "/testimoni", label: "Testimoni" },
        { href: "/kontak", label: "Kontak & Alamat" },
        { href: "/syarat-ketentuan", label: "S&K" },
      ],
    },
    home: {
      hero: {
        title: (brand: string, name: string) => `Promo Spesial ${brand} ${name}`,
        description: "Dapatkan diskon 25% untuk perjalanan akhir pekan Anda!",
        bookNow: "Pesan Sekarang",
      },
      fleet: {
        title: "Armada Kami",
        searchPlaceholder: "Cari mobil...",
        filterAndSort: "Filter & Sortir",
        filterDescription: "Sesuaikan pencarian mobil Anda.",
        filters: {
          brand: {
            title: "Brand",
            placeholder: "Tampilkan semua brand",
            all: "Semua Brand",
          },
          type: {
            title: "Tipe Mobil",
            placeholder: "Tampilkan semua tipe",
            all: "Semua Tipe",
          },
        },
        sort: {
          title: "Sortir",
          priceAsc: "Harga Terendah",
          priceDesc: "Harga Tertinggi",
          ratingDesc: "Rating Tertinggi",
        },
        reset: "Reset",
        showResults: "Tampilkan Hasil",
        showMore: "Tampilkan Lebih Banyak",
      },
    },
    vehicleCard: {
        priceStartFrom: "Mulai dari",
        day: "hari",
        book: "Pesan",
        tooltip: "Tekan untuk detail",
        outOfStock: "Stok Habis",
    },
    orderForm: {
        title: "Form Pemesanan",
        tabs: {
            direct: {
                title: "Pesan Langsung",
                duration: "Durasi Sewa (hari)",
            },
            reservation: {
                title: "Reservasi",
                startDate: "Mulai dari",
                endDate: "Sampai dengan",
                selectDate: "Pilih tanggal",
            }
        },
        common: {
            transmission: {
                label: "Transmisi",
            },
            service: {
                label: "Layanan",
                placeholder: "Pilih layanan",
                options: {
                    selfDrive: "Lepas Kunci",
                    withDriver: "Dengan Supir",
                    allInclude: "All Include",
                }
            },
            driver: {
                label: "Pilih Supir",
                placeholder: "Pilih supir yang tersedia",
                noAvailable: "Tidak ada supir tersedia",
                selectionRequired: "Silakan pilih supir terlebih dahulu.",
            },
        },
        summary: {
            title: "Rincian Pesanan",
            basePrice: (days: number) => `Harga Sewa (${days} hari)`,
            driverFee: "Biaya Supir",
            fuelFee: "Biaya BBM",
            maticFee: "Biaya Transmisi Matic",
            duration: "Durasi",
            days: "hari",
            total: "Total",
        },
        bookNow: "Lanjutkan ke Pembayaran",
    },
    payment: {
        title: "Checkout & Pembayaran",
        description: "Selesaikan pesanan Anda dalam beberapa langkah mudah.",
        days: "hari",
        personalData: {
            title: "Data Diri Anda",
            fullName: "Nama Lengkap",
            fullNamePlaceholder: "Masukkan nama lengkap Anda",
            phone: "Nomor Telepon (WhatsApp)",
            phonePlaceholder: "cth. 081234567890",
            phoneHint: "Pastikan nomor ini valid untuk pengiriman invoice dan konfirmasi."
        },
        orderSummary: {
            title: "Ringkasan Pesanan",
            rentalPeriod: "Periode Sewa",
            rentalPrice: (days: number) => `Harga Sewa (${days} hari)`,
            driverFee: (days: number) => `Biaya Supir (${days} hari)`,
            fuelFee: (days: number) => `Biaya BBM (${days} hari)`,
            maticFee: "Biaya Transmisi Matic",
            totalPayment: "Total Pembayaran",
        },
        paymentMethod: {
            title: "Pilih Metode Pembayaran",
            bank: {
                title: "Transfer Bank",
                description: "Bayar ke rekening BCA atau Mandiri kami. DP 50% diperlukan.",
            },
            qris: {
                title: "QRIS",
                description: "Scan kode QR untuk pembayaran instan. Pembayaran penuh.",
            },
        },
        confirmAndPay: "Konfirmasi & Bayar",
        attention: {
            title: "Perhatian!",
            description: "Tim kami akan menghubungi Anda melalui WhatsApp untuk verifikasi setelah pembayaran dikonfirmasi.",
        },
        validation: {
            title: "Formulir Tidak Lengkap",
            description: "Mohon isi nama lengkap dan nomor telepon sebelum melanjutkan.",
        }
    },
    confirmation: {
        title: "Selesaikan Pembayaran",
        description: "Mohon selesaikan pembayaran agar pesanan Anda dapat kami proses.",
        orderNumber: "Nomor Pesanan",
        status: "Status",
        statusAwaitingPayment: "Menunggu Pembayaran",
        vehicle: "Kendaraan",
        rentalPeriod: "Periode Sewa",
        service: "Layanan",
        driver: "Driver",
        totalPayment: "Total Pembayaran",
        paymentTo: "Transfer Ke",
        paymentMethod: "Metode Pembayaran",
        invalidPeriod: "Periode tidak valid",
        days: "hari",
        copy: "Salin",
        copied: "Berhasil Disalin",
        paymentInstructions: {
            bank: {
                title: "Instruksi Pembayaran",
                description: "Silakan lakukan pembayaran ke salah satu rekening di bawah ini.",
                selectBank: "Pilih Bank Tujuan",
            },
            qris: {
                title: "Instruksi Pembayaran QRIS",
                description: "Silakan pindai kode QR di bawah ini menggunakan aplikasi perbankan atau e-wallet Anda.",
                download: "Unduh Kode QR",
                important: {
                    title: "Penting!",
                    description: "Pastikan nominal yang Anda masukkan sesuai dengan total tagihan.",
                }
            }
        },
        upload: {
            title: "Unggah Bukti Pembayaran",
            description: "Setelah melakukan pembayaran, silakan unggah bukti transfer atau screenshot di sini.",
            success: {
                title: "Satu Langkah Lagi!",
                description: "Bukti pembayaran Anda telah terkirim. Mohon konfirmasi pesanan Anda kepada admin melalui WhatsApp untuk mempercepat proses verifikasi.",
                contactAdmin: "Hubungi Admin via WhatsApp",
                contactDriver: "Hubungi Supir",
                adminWhatsappMessage: (orderId: string) => `Halo Admin, saya ingin konfirmasi pembayaran untuk pesanan dengan Order ID: ${orderId}`
            },
            error: {
                title: "Upload Gagal",
            },
            selectFile: "Pilih File",
            fileHint: "PNG, JPG, JPEG (maks. 4MB)",
            preview: "Pratinjau:",
            uploading: "Mengunggah...",
            submit: "Kirim Bukti Pembayaran",
            selectBankFirst: "Silakan pilih bank tujuan terlebih dahulu sebelum mengirim bukti.",
        },
        error: {
            title: "Data Pesanan Tidak Lengkap",
            description: "Informasi pesanan tidak lengkap atau tidak valid. Silakan kembali ke halaman utama dan ulangi proses pemesanan.",
            backButton: "Kembali ke Halaman Utama",
        },
    },
    testimonials: {
        title: "Testimoni Pelanggan",
        description: "Lihat apa kata mereka tentang layanan kami.",
        tabs: {
            reviews: "Ulasan Pelanggan",
            gallery: "Galeri Foto",
        },
        rented: "Menyewa",
        galleryAlt: "Galeri pelanggan MudaKarya RentCar",
        galleryHover: "Momen bersama MudaKarya RentCar",
    },
    contact: {
        title: "Hubungi & Kunjungi Kami",
        description: "Kami siap membantu Anda 24/7.",
        mapTitle: "Peta Lokasi MudaKarya RentCar",
        getDirections: "Arah",
        contactWhatsApp: "WhatsApp",
        officeAddress: "Alamat Kantor",
        email: "Email",
        phone: "Telepon",
        socialMedia: {
            title: "Temukan Kami di Media Sosial"
        }
    },
    terms: {
        title: "Syarat & Ketentuan",
        description: "Harap baca dengan saksama syarat dan ketentuan sewa mobil kami sebelum melakukan pemesanan.",
        general: {
            title: "Persyaratan Umum",
        },
        payment: {
            title: "Metode Pembayaran",
            description: "Kami menerima metode pembayaran berikut:",
            downPayment: "DP (Down Payment) sebesar 50% wajib dibayarkan saat melakukan reservasi, dan pelunasan dilakukan saat pengambilan kendaraan.",
        }
    },
    vehicleDetail: {
        pricePerDay: "Harga sewa per hari",
        bookNow: "Pesan Sekarang",
        details: {
            title: "Detail Kendaraan",
            brand: "Brand",
            type: "Tipe",
            transmission: "Transmisi",
            fuel: "Bahan Bakar",
            capacity: "Kapasitas",
            passenger: "Penumpang",
            year: "Tahun",
        },
        reviews: {
            customerReviews: "Ulasan Pelanggan",
            galleryTab: "Galeri Mobil Ini",
            noReviews: "Belum ada ulasan untuk mobil ini.",
            noPhotos: "Belum ada foto untuk mobil ini.",
            writeReview: "Tulis Ulasan Anda",
            shareExperience: "Bagikan pengalaman Anda",
            formDescription: "Bagaimana pengalaman Anda dengan mobil dan layanan kami?",
            yourName: "Nama Anda",
            namePlaceholder: "Tulis nama Anda",
            commentLabel: "Komentar",
            commentPlaceholder: "Tulis komentar Anda di sini...",
            yourRating: "Rating Anda:",
            submitReview: "Kirim Ulasan",
        },
        otherRecommendations: "Rekomendasi Mobil Lain",
    },
    starRating: {
        reviews: "ulasan",
    },
    backToHome: "Kembali ke Home"
};

const en: typeof id = {
    loading: "Loading",
    navLinks: [
      { href: "/", label: "Home", icon: Home },
      { href: "/profil", label: "Profile", icon: Building },
      { href: "/testimoni", label: "Testimonials", icon: Star },
      { href: "/kontak", label: "Address", icon: Pin },
      { href: "/syarat-ketentuan", label: "T&C", icon: FileText },
    ],
    footer: {
      description: "The best car rental solution with professional service and well-maintained fleet.",
      navigation: "Navigation",
      contactUs: "Contact Us",
      copyright: (year: number) => `© ${year} MudaKarya RentCar. All rights reserved.`,
      navLinks: [
        { href: "/", label: "Home" },
        { href: "/profil", label: "Company Profile" },
        { href: "/testimoni", label: "Testimonials" },
        { href: "/kontak", label: "Contact & Address" },
        { href: "/syarat-ketentuan", label: "T&C" },
      ],
    },
    home: {
      hero: {
        title: (brand: string, name: string) => `Special Promo for ${brand} ${name}`,
        description: "Get a 25% discount for your weekend trip!",
        bookNow: "Book Now",
      },
      fleet: {
        title: "Our Fleet",
        searchPlaceholder: "Search for a car...",
        filterAndSort: "Filter & Sort",
        filterDescription: "Customize your car search.",
        filters: {
          brand: {
            title: "Brand",
            placeholder: "Show all brands",
            all: "All Brands",
          },
          type: {
            title: "Car Type",
            placeholder: "Show all types",
            all: "All Types",
          },
        },
        sort: {
          title: "Sort by",
          priceAsc: "Lowest Price",
          priceDesc: "Highest Price",
          ratingDesc: "Highest Rating",
        },
        reset: "Reset",
        showResults: "Show Results",
        showMore: "Show More",
      },
    },
    vehicleCard: {
        priceStartFrom: "Starts from",
        day: "day",
        book: "Book",
        tooltip: "Click for details",
        outOfStock: "Out of Stock",
    },
    orderForm: {
        title: "Booking Form",
        tabs: {
            direct: {
                title: "Direct Booking",
                duration: "Rental Duration (days)",
            },
            reservation: {
                title: "Reservation",
                startDate: "Start from",
                endDate: "Until",
                selectDate: "Select date",
            }
        },
        common: {
            transmission: {
                label: "Transmission",
            },
            service: {
                label: "Service",
                placeholder: "Select service",
                options: {
                    selfDrive: "Self Drive",
                    withDriver: "With Driver",
                    allInclude: "All Include",
                }
            },
             driver: {
                label: "Select Driver",
                placeholder: "Select available driver",
                noAvailable: "No drivers available",
                selectionRequired: "Please select a driver first.",
            },
        },
        summary: {
            title: "Order Details",
            basePrice: (days: number) => `Rental Price (${days} days)`,
            driverFee: "Driver Fee",
            fuelFee: "Fuel Fee",
            maticFee: "Matic Transmission Fee",
            duration: "Duration",
            days: "days",
            total: "Total",
        },
        bookNow: "Continue to Payment",
    },
     payment: {
        title: "Checkout & Payment",
        description: "Complete your order in a few easy steps.",
        days: "days",
        personalData: {
            title: "Your Personal Data",
            fullName: "Full Name",
            fullNamePlaceholder: "Enter your full name",
            phone: "Phone Number (WhatsApp)",
            phonePlaceholder: "e.g. 081234567890",
            phoneHint: "Ensure this number is valid for invoice and confirmation delivery."
        },
        orderSummary: {
            title: "Order Summary",
            rentalPeriod: "Rental Period",
            rentalPrice: (days: number) => `Rental Price (${days} days)`,
            driverFee: (days: number) => `Driver Fee (${days} days)`,
            fuelFee: (days: number) => `Fuel Fee (${days} days)`,
            maticFee: "Matic Transmission Fee",
            totalPayment: "Total Payment",
        },
        paymentMethod: {
            title: "Select Payment Method",
            bank: {
                title: "Bank Transfer",
                description: "Pay to our BCA or Mandiri account. 50% DP required.",
            },
            qris: {
                title: "QRIS",
                description: "Scan the QR code for instant payment. Full payment required.",
            },
        },
        confirmAndPay: "Confirm & Pay",
        attention: {
            title: "Attention!",
            description: "Our team will contact you via WhatsApp for verification after payment is confirmed.",
        },
        validation: {
            title: "Incomplete Form",
            description: "Please fill in your full name and phone number before proceeding.",
        }
    },
    confirmation: {
        title: "Complete Payment",
        description: "Please complete the payment so we can process your order.",
        orderNumber: "Order Number",
        status: "Status",
        statusAwaitingPayment: "Awaiting Payment",
        vehicle: "Vehicle",
        rentalPeriod: "Rental Period",
        service: "Service",
        driver: "Driver",
        totalPayment: "Total Payment",
        paymentTo: "Payment To",
        paymentMethod: "Payment Method",
        invalidPeriod: "Invalid period",
        days: "days",
        copy: "Copy",
        copied: "Copied!",
        paymentInstructions: {
            bank: {
                title: "Payment Instructions",
                description: "Please make the payment to one of the bank accounts below.",
                selectBank: "Select Destination Bank",
            },
            qris: {
                title: "QRIS Payment Instructions",
                description: "Please scan the QR code below using your banking or e-wallet application.",
                download: "Download QR Code",
                important: {
                    title: "Important!",
                    description: "Please ensure the amount you enter matches the total bill.",
                }
            }
        },
        upload: {
            title: "Upload Payment Proof",
            description: "After making the payment, please upload the transfer proof or screenshot here.",
            success: {
                title: "One More Step!",
                description: "Your proof of payment has been sent. Please confirm your order with our admin via WhatsApp to speed up the verification process.",
                contactAdmin: "Contact Admin via WhatsApp",
                contactDriver: "Contact Driver",
                adminWhatsappMessage: (orderId: string) => `Hello Admin, I want to confirm payment for Order ID: ${orderId}`
            },
            error: {
                title: "Upload Failed",
            },
            selectFile: "Select File",
            fileHint: "PNG, JPG, JPEG (max. 4MB)",
            preview: "Preview:",
            uploading: "Uploading...",
            submit: "Submit Payment Proof",
            selectBankFirst: "Please select a destination bank before submitting proof.",
        },
        error: {
            title: "Incomplete Order Data",
            description: "Order information is incomplete or invalid. Please return to the main page and repeat the booking process.",
            backButton: "Back to Home",
        },
    },
    testimonials: {
        title: "Customer Testimonials",
        description: "See what they say about our service.",
        tabs: {
            reviews: "Customer Reviews",
            gallery: "Photo Gallery",
        },
        rented: "Rented",
        galleryAlt: "MudaKarya RentCar customer gallery",
        galleryHover: "Moments with MudaKarya RentCar",
    },
    contact: {
        title: "Contact & Visit Us",
        description: "We are ready to help you 24/7.",
        mapTitle: "MudaKarya RentCar Location Map",
        getDirections: "Directions",
        contactWhatsApp: "WhatsApp",
        officeAddress: "Office Address",
        email: "Email",
        phone: "Phone",
        socialMedia: {
            title: "Find Us on Social Media"
        }
    },
    terms: {
        title: "Terms & Conditions",
        description: "Please read our car rental terms and conditions carefully before making a booking.",
        general: {
            title: "General Requirements",
        },
        payment: {
            title: "Payment Methods",
            description: "We accept the following payment methods:",
            downPayment: "A 50% Down Payment (DP) is required upon reservation, and the balance is paid upon vehicle pickup.",
        }
    },
    vehicleDetail: {
        pricePerDay: "Rental price per day",
        bookNow: "Book Now",
        details: {
            title: "Vehicle Details",
            brand: "Brand",
            type: "Type",
            transmission: "Transmission",
            fuel: "Fuel",
            capacity: "Capacity",
            passenger: "Passengers",
            year: "Year",
        },
        reviews: {
            customerReviews: "Customer Reviews",
            galleryTab: "This Car's Gallery",
            noReviews: "No reviews for this car yet.",
            noPhotos: "No photos for this car yet.",
            writeReview: "Write Your Review",
            shareExperience: "Share your experience",
            formDescription: "How was your experience with our car and service?",
            yourName: "Your Name",
            namePlaceholder: "Enter your name",
            commentLabel: "Comment",
            commentPlaceholder: "Write your comment here...",
            yourRating: "Your Rating:",
            submitReview: "Submit Review",
        },
        otherRecommendations: "Other Car Recommendations",
    },
    starRating: {
        reviews: "reviews",
    },
    backToHome: "Back to Home"
};

export const dictionaries = { id, en };
export type Language = keyof typeof dictionaries;
