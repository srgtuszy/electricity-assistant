import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:electricity_assistant/tip.dart';

class TipStore {
  static const String collectionName = 'tips';
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  CollectionReference<Map<String, dynamic>> get tipsCollection =>
      _firestore.collection(collectionName);

  Stream<List<Tip>> streamTips() {
    return tipsCollection.snapshots().map((snapshot) =>
        snapshot.docs.map((doc) => Tip.fromFirestore(doc.data())).toList());
  }

  Future<List<Tip>> fetchTips() async {
    final snapshot =
        await tipsCollection.orderBy('date', descending: true).get();
    return snapshot.docs.map((doc) => Tip.fromFirestore(doc.data())).toList();
  }

  Future<void> clearTips() async {
    await tipsCollection.get().then((snapshot) {
      for (var doc in snapshot.docs) {
        doc.reference.delete();
      }
    });
  }
}
