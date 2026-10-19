import {
  NODE_COLORS,
  SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasShape,
} from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

type NodeColorName = (typeof NODE_COLORS)[number]["name"]

function templateNode(
  id: string,
  label: string,
  shape: CanvasShape,
  colorName: NodeColorName,
  x: number,
  y: number,
): CanvasNode {
  const size = SHAPE_DEFAULT_SIZES[shape]
  const color = NODE_COLORS.find((entry) => entry.name === colorName)

  if (!color) {
    throw new Error(`Unknown canvas node color: ${colorName}`)
  }

  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width: size.width,
    height: size.height,
    data: {
      label,
      color: color.fill,
      textColor: color.text,
      shape,
    },
  }
}

function templateEdge(
  id: string,
  source: string,
  target: string,
  label = "",
): CanvasEdge {
  return {
    id,
    source,
    target,
    type: "canvasEdge",
    data: { label },
  }
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "API Gateway routes traffic to isolated services, each backed by a dedicated database and connected through a shared message bus.",
    nodes: [
      templateNode("client", "Client", "pill", "Blue", 0, 156),
      templateNode("gateway", "API Gateway", "rectangle", "Teal", 270, 144),
      templateNode("orders", "Orders", "pill", "Purple", 580, 0),
      templateNode("payments", "Payments", "pill", "Purple", 580, 126),
      templateNode("users", "Users", "pill", "Purple", 580, 252),
      templateNode("bus", "Event Bus", "hexagon", "Orange", 286, 338),
      templateNode("orders-db", "Orders DB", "cylinder", "Neutral", 890, -20),
      templateNode("payments-db", "Payments DB", "cylinder", "Neutral", 890, 106),
      templateNode("users-db", "Users DB", "cylinder", "Neutral", 890, 232),
    ],
    edges: [
      templateEdge("client-gateway", "client", "gateway"),
      templateEdge("gateway-orders", "gateway", "orders"),
      templateEdge("gateway-payments", "gateway", "payments"),
      templateEdge("gateway-users", "gateway", "users"),
      templateEdge("orders-db-edge", "orders", "orders-db"),
      templateEdge("payments-db-edge", "payments", "payments-db"),
      templateEdge("users-db-edge", "users", "users-db"),
      templateEdge("orders-bus", "orders", "bus"),
      templateEdge("payments-bus", "payments", "bus"),
      templateEdge("users-bus", "users", "bus"),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "End-to-end delivery from source commit through build, test, containerisation, approval, and staged deployment to production.",
    nodes: [
      templateNode("source", "Source", "rectangle", "Blue", 0, 28),
      templateNode("build", "Build", "pill", "Teal", 245, 40),
      templateNode("test", "Test", "pill", "Green", 500, 40),
      templateNode("image", "Container", "cylinder", "Purple", 755, 20),
      templateNode("approval", "Approve", "diamond", "Orange", 1025, 0),
      templateNode("staging", "Staging", "pill", "Red", 1305, 40),
      templateNode("production", "Production", "pill", "Green", 1570, 40),
    ],
    edges: [
      templateEdge("source-build", "source", "build"),
      templateEdge("build-test", "build", "test"),
      templateEdge("test-image", "test", "image"),
      templateEdge("image-approval", "image", "approval"),
      templateEdge("approval-staging", "approval", "staging"),
      templateEdge("staging-production", "staging", "production"),
    ],
  },
  {
    id: "event-driven-system",
    name: "Event-Driven System",
    description:
      "Producers publish events to a central bus. Independent consumers handle emails, push notifications, analytics, and error queues.",
    nodes: [
      templateNode("web", "Web App", "pill", "Blue", 0, 0),
      templateNode("mobile", "Mobile App", "pill", "Blue", 0, 145),
      templateNode("partner", "Partner API", "pill", "Blue", 0, 290),
      templateNode("event-bus", "Event Bus", "hexagon", "Purple", 345, 130),
      templateNode("email", "Email Worker", "rectangle", "Teal", 705, -20),
      templateNode("push", "Push Worker", "rectangle", "Teal", 705, 105),
      templateNode("analytics", "Analytics", "rectangle", "Teal", 705, 230),
      templateNode("dead-letter", "Error Queue", "rectangle", "Red", 705, 355),
      templateNode("event-store", "Event Store", "cylinder", "Neutral", 1010, 105),
    ],
    edges: [
      templateEdge("web-bus", "web", "event-bus"),
      templateEdge("mobile-bus", "mobile", "event-bus"),
      templateEdge("partner-bus", "partner", "event-bus"),
      templateEdge("bus-email", "event-bus", "email"),
      templateEdge("bus-push", "event-bus", "push"),
      templateEdge("bus-analytics", "event-bus", "analytics"),
      templateEdge("bus-errors", "event-bus", "dead-letter"),
      templateEdge("email-store", "email", "event-store"),
      templateEdge("push-store", "push", "event-store"),
      templateEdge("analytics-store", "analytics", "event-store"),
    ],
  },
]
