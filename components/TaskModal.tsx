import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskAdded?: () => void;
  task?: any; // For editing
}

export default function TaskModal({ visible, onClose, onTaskAdded, task }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "Media");
  const [dueDate, setDueDate] = useState(task?.due_date || "");
  const [loading, setLoading] = useState(false);

  const backendHost =
    Platform.OS === 'web'
      ? 'http://localhost:3000'
      : 'http://10.0.2.2:3000';

 const handleAddTask = async () => {
  if (!title.trim() || !description.trim()) {
    alert("Completa los campos");
    return;
  }

  setLoading(true);

  try {
    const url = task
      ? `${backendHost}/api/tasks/${task.id}`
      : `${backendHost}/api/tasks`;
    const method = task ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        status: task?.status || "Pendiente",
        priority,
        due_date: dueDate || null,
      }),
    });

    const data = await response.json();

    console.log("RESPUESTA:", data);

    if (!response.ok) {
      throw new Error("Error del backend");
    }

    alert(task ? "Tarea actualizada correctamente ✅" : "Tarea creada correctamente ✅");

    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("Media");

    onTaskAdded?.();
    onClose();

  } catch (error) {
    console.log("ERROR REAL:", error);
    alert("No se pudo guardar la tarea");
  } finally {
    setLoading(false);
  }
};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
          }}
        >
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* HEADER */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#064e3b" }}>
                {task ? "Editar Tarea" : "Nueva Tarea"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ fontSize: 24, color: "#6b7280" }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* TÍTULO */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#374151", fontWeight: "600", marginBottom: 6 }}>
                Título
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 16,
                  color: "#064e3b",
                }}
                placeholder="Escribe el título de la tarea"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* DESCRIPCIÓN */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#374151", fontWeight: "600", marginBottom: 6 }}>
                Descripción
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 16,
                  color: "#064e3b",
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                placeholder="Describe la tarea"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* PRIORIDAD */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#374151", fontWeight: "600", marginBottom: 6 }}>
                Prioridad
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {(["Baja", "Media", "Alta"] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setPriority(level)}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: priority === level ? "#065f46" : "#e5e7eb",
                      backgroundColor: priority === level ? "#ecfdf5" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontWeight: "600",
                        color: priority === level ? "#065f46" : "#6b7280",
                      }}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* FECHA */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: "#374151", fontWeight: "600", marginBottom: 6 }}>
                Fecha de entrega (opcional)
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 16,
                  color: "#064e3b",
                }}
                placeholder="YYYY-MM-DD"
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>

            {/* BOTONES */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ textAlign: "center", color: "#374151", fontWeight: "600" }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddTask}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: loading ? "#9ca3af" : "#065f46",
                }}
              >
                <Text style={{ textAlign: "center", color: "#fff", fontWeight: "600" }}>
                  {loading ? (task ? "Actualizando..." : "Agregando...") : (task ? "Actualizar" : "Agregar")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
