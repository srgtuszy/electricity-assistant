import 'dart:async';
import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:electricity_assistant/electricity_chart.dart';
import 'package:electricity_assistant/firebase_options.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  FirebaseFirestore.instance.databaseId = "measurements";
  runApp(const ElectricityAssistantApp());
}

class ElectricityAssistantApp extends StatelessWidget {
  const ElectricityAssistantApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Electricity Assistant',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

/// [HomePage] displays the electricity chart and a button to start/stop data generation.
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  Timer? _timer;
  bool isGenerating = false;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  /// Toggles the data generation process.
  void _toggleDataGeneration() async {
    if (isGenerating) {
      _timer?.cancel();
      setState(() {
        isGenerating = false;
      });
    } else {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) async {
        await _addRandomValueToFirestore();
      });
      setState(() {
        isGenerating = true;
      });
    }
  }

  /// Adds a random electricity usage value to Firestore.
  Future<void> _addRandomValueToFirestore() async {
    final random = Random();
    final kwh =
        50 + random.nextDouble() * 150; // Random value between 50 and 200 kWh
    final timestamp = DateTime.now();

    try {
      final doc =
          await FirebaseFirestore.instance.collection('electricity').add({
        'kwh': kwh,
        'date': timestamp,
      });
      print('Added document with ID: ${doc.id}');
    } catch (e) {
      print('Error adding data to Firestore: $e');
    }
  }

  Future<void> _clearFirestoreData() async {
    try {
      final collection = FirebaseFirestore.instance.collection('electricity');
      final snapshot = await collection.get();
      for (var doc in snapshot.docs) {
        await doc.reference.delete();
      }
    } catch (e) {
      print('Error clearing Firestore data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Electricity Assistant'),
      ),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            height: 300,
            child: ElectricityChart(),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _toggleDataGeneration,
            child: Text(isGenerating
                ? 'Stop Generating Data'
                : 'Start Generating Data'),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: _clearFirestoreData,
            child: const Text('Clear Firestore Data'),
          ),
        ],
      ),
    );
  }
}
